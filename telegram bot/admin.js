const fs = require("fs");
const path = require("path");
const axios = require("axios");
const moment = require("moment");
const bot = require("./bot");

const API_URL = "https://royalapart.online/api";

// Phones allowed to become admins (comma-separated in env). Compared by digits only.
const ADMIN_PHONES = (process.env.ADMIN_PHONES || "+380983405578")
  .split(",")
  .map((p) => p.replace(/\D/g, ""))
  .filter(Boolean);

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // re-verify phone every 30 days
const PENDING_TTL_MS = 5 * 60 * 1000; // time to share contact after /admin
const BROADCAST_TTL_MS = 10 * 60 * 1000; // time to send broadcast draft

const dataDir = path.join(__dirname, "data");
const adminsFile = path.join(dataDir, "admins.json");

// userId -> { phone, verifiedAt }
let admins = {};
const pendingAuth = new Map(); // userId -> expiresAt
const awaitingBroadcast = new Map(); // userId -> expiresAt
const broadcastDrafts = new Map(); // userId -> { chatId, messageId }
let broadcastRunning = false;

const loadAdmins = () => {
  try {
    if (fs.existsSync(adminsFile)) {
      admins = JSON.parse(fs.readFileSync(adminsFile, "utf8")) || {};
    }
  } catch (err) {
    console.error("[Admin] Failed to load admins:", err.message);
    admins = {};
  }
};

const saveAdmins = () => {
  try {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(adminsFile, JSON.stringify(admins, null, 2), { mode: 0o600 });
  } catch (err) {
    console.error("[Admin] Failed to save admins:", err.message);
  }
};

const normalizePhone = (phone) => String(phone || "").replace(/\D/g, "");

const isAdmin = (userId) => {
  const entry = admins[String(userId)];
  if (!entry) return false;
  if (!ADMIN_PHONES.includes(normalizePhone(entry.phone))) return false;
  if (Date.now() - entry.verifiedAt > SESSION_TTL_MS) return false;
  return true;
};

const getAdminIds = () => Object.keys(admins).filter(isAdmin);

const escapeHtml = (text) =>
  String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const isPrivate = (msg) => msg.chat && msg.chat.type === "private";

const adminMenu = {
  reply_markup: JSON.stringify({
    inline_keyboard: [
      [{ text: "📊 Статистика", callback_data: "admin:stats" }],
      [
        { text: "🏠 Вільні сьогодні", callback_data: "admin:free_today" },
        { text: "🏠 Вільні завтра", callback_data: "admin:free_tomorrow" },
      ],
      [
        { text: "💰 Ціни WuBook", callback_data: "admin:prices" },
        { text: "🏷 Знижки", callback_data: "admin:sales" },
      ],
      [{ text: "📢 Розсилка", callback_data: "admin:broadcast" }],
      [{ text: "🚪 Вийти з адмінки", callback_data: "admin:logout" }],
      [{ text: "🔙 Меню ●", callback_data: "back_to_menu" }],
    ],
  }),
};

const showAdminPanel = (chatId) =>
  bot.sendMessage(chatId, "🔐 <b>Адмін-панель</b>\nОберіть дію:", {
    parse_mode: "HTML",
    ...adminMenu,
  });

const setAdminCommands = (chatId) =>
  bot
    .setMyCommands(
      [
        { command: "/start", description: "Запустити бота" },
        { command: "/admin", description: "Адмін-панель" },
      ],
      { scope: { type: "chat", chat_id: chatId } }
    )
    .catch((err) => console.error("[Admin] setMyCommands:", err.message));

const clearAdminCommands = (chatId) =>
  bot
    .deleteMyCommands({ scope: JSON.stringify({ type: "chat", chat_id: chatId }) })
    .catch((err) => console.error("[Admin] deleteMyCommands:", err.message));

// Kyiv date in DD/MM/YYYY, shifted by `days`
const kyivDate = (days = 0) => {
  const today = new Date().toLocaleDateString("en-GB", { timeZone: "Europe/Kyiv" });
  return moment(today, "DD/MM/YYYY").add(days, "day").format("DD/MM/YYYY");
};

// Prices >= this are placeholders for "negotiable / long-term only" (same rule as the room cards)
const NEGOTIABLE_PRICE = 10000;
const WEEKDAYS = ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

const money = (n) => `${Math.round(n).toLocaleString("uk-UA")} грн`;

// Read-only API helpers
const fetchUserIds = async () => {
  const { data } = await axios.get(`${API_URL}/getAllUsers/AllUsers`, { timeout: 15000 });
  return (data.userIds || []).filter(Boolean);
};
const fetchApartments = async () => {
  const { data } = await axios.get(`${API_URL}/aparts`, { timeout: 15000 });
  return Array.isArray(data?.data) ? data.data : [];
};
const fetchSales = async () => {
  const { data } = await axios.get(`${API_URL}/sales/all`, { timeout: 15000 });
  return Array.isArray(data) ? data : [];
};
const fetchWubookPrices = async () => {
  const { data } = await axios.get(`${API_URL}/analis/tarifPrices/current`, { timeout: 60000 });
  return Array.isArray(data?.prices) ? data.prices : [];
};

const startOfKyivToday = () => moment(kyivDate(0), "DD/MM/YYYY").toDate();
const activeSales = (sales) =>
  sales.filter((s) => new Date(s.tillDate) >= startOfKyivToday() && Number(s.discount) > 0);

const sendStats = async (chatId) => {
  // Each source is independent: one failing endpoint only hides its own line
  const [users, aparts, sales] = await Promise.allSettled([
    fetchUserIds(),
    fetchApartments(),
    fetchSales(),
  ]);
  const lines = ["📊 <b>Статистика</b>", ""];

  if (users.status === "fulfilled") {
    lines.push(`👥 Користувачів бота: <b>${users.value.length}</b>`);
  } else {
    console.error("[Admin] stats users:", users.reason?.message);
    lines.push("👥 Користувачі: ❌ недоступно");
  }

  if (aparts.status === "fulfilled" && aparts.value.length) {
    const rooms = aparts.value;
    const byCategory = {};
    rooms.forEach((r) => {
      const key = r.category || "інше";
      byCategory[key] = (byCategory[key] || 0) + 1;
    });
    const categories = Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => `${escapeHtml(name)} ${count}`)
      .join(" · ");
    lines.push(`🏠 Квартир: <b>${rooms.length}</b> (${categories})`);

    const prices = rooms.map((r) => Number(r.price)).filter((p) => p > 0 && p < NEGOTIABLE_PRICE);
    if (prices.length) {
      const avg = prices.reduce((s, p) => s + p, 0) / prices.length;
      lines.push(
        `💵 Базова ціна: сер. <b>${money(avg)}</b> (${money(Math.min(...prices))} – ${money(Math.max(...prices))})`
      );
    }
    const guests = rooms.reduce((s, r) => s + (Number(r.guests) || 0), 0);
    if (guests) lines.push(`🛏 Місткість: ${guests} гостей`);
  } else {
    if (aparts.status === "rejected") console.error("[Admin] stats aparts:", aparts.reason?.message);
    lines.push("🏠 Квартири: ❌ недоступно");
  }

  if (sales.status === "fulfilled") {
    lines.push(`🏷 Активних знижок: <b>${activeSales(sales.value).length}</b>`);
  } else {
    console.error("[Admin] stats sales:", sales.reason?.message);
    lines.push("🏷 Знижки: ❌ недоступно");
  }

  await bot.sendMessage(chatId, lines.join("\n"), { parse_mode: "HTML", ...adminMenu });
};

const sendPrices = async (chatId) => {
  await bot.sendMessage(chatId, "⏳ Отримую ціни з WuBook...");
  try {
    const prices = await fetchWubookPrices();
    const today = startOfKyivToday();

    // date -> regular (non-negotiable) prices
    const byDate = new Map();
    let negotiableToday = 0;
    for (const p of prices) {
      const date = moment(p.date, "DD/MM/YYYY", true);
      const price = Number(p.price);
      if (!date.isValid() || date.toDate() < today || !(price > 0)) continue;
      const key = date.format("YYYY-MM-DD");
      if (!byDate.has(key)) byDate.set(key, []);
      if (price >= NEGOTIABLE_PRICE) {
        if (date.isSame(today, "day")) negotiableToday++;
        continue;
      }
      byDate.get(key).push({ price, name: p.roomName });
    }

    const days = [...byDate.keys()].sort();
    if (!days.length) {
      return await bot.sendMessage(chatId, "Немає даних про ціни на найближчі дні.", adminMenu);
    }

    const lines = ["💰 <b>Ціни WuBook</b>", ""];
    let prevAvg = null;
    for (const day of days) {
      const items = byDate.get(day);
      if (!items.length) continue;
      const avg = items.reduce((s, i) => s + i.price, 0) / items.length;
      const trend = prevAvg === null ? "" : avg > prevAvg ? " ↑" : avg < prevAvg ? " ↓" : "";
      const d = moment(day, "YYYY-MM-DD");
      lines.push(
        `${WEEKDAYS[d.day()]} ${d.format("DD.MM")} — сер. <b>${money(avg)}</b>${trend} (${money(
          Math.min(...items.map((i) => i.price))
        )} – ${money(Math.max(...items.map((i) => i.price)))})`
      );
      prevAvg = avg;
    }

    const todayItems = (byDate.get(days[0]) || []).slice().sort((a, b) => b.price - a.price);
    if (todayItems.length) {
      const fmt = (i) => `${escapeHtml(i.name)} — ${money(i.price)}`;
      lines.push("", `🔝 Найдорожчі (${moment(days[0]).format("DD.MM")}):`);
      todayItems.slice(0, 3).forEach((i) => lines.push(`• ${fmt(i)}`));
      lines.push("💸 Найдешевші:");
      todayItems.slice(-3).reverse().forEach((i) => lines.push(`• ${fmt(i)}`));
    }
    if (negotiableToday) lines.push("", `🤝 Договірна ціна сьогодні: ${negotiableToday} кв.`);

    await bot.sendMessage(chatId, lines.join("\n"), { parse_mode: "HTML", ...adminMenu });
  } catch (err) {
    console.error("[Admin] prices:", err.message);
    await bot.sendMessage(chatId, "❌ Не вдалося отримати ціни з WuBook.", adminMenu);
  }
};

const sendSales = async (chatId) => {
  try {
    const [sales, aparts] = await Promise.all([fetchSales(), fetchApartments().catch(() => [])]);
    const nameByWubid = new Map(aparts.map((r) => [Number(r.wubid), r.name]));
    const active = activeSales(sales).sort((a, b) => new Date(a.tillDate) - new Date(b.tillDate));

    const list = active.length
      ? active
          .slice(0, 50)
          .map(
            (s) =>
              `• ${escapeHtml(nameByWubid.get(Number(s.roomId)) || `ID ${s.roomId}`)} — <b>-${Number(
                s.discount
              )}%</b> до ${moment(s.tillDate).format("DD.MM.YYYY")}`
          )
          .join("\n")
      : "Активних знижок немає.";

    await bot.sendMessage(chatId, `🏷 <b>Активні знижки: ${active.length}</b>\n\n${list}`, {
      parse_mode: "HTML",
      ...adminMenu,
    });
  } catch (err) {
    console.error("[Admin] sales:", err.message);
    await bot.sendMessage(chatId, "❌ Не вдалося отримати знижки.", adminMenu);
  }
};

const sendFreeRooms = async (chatId, offsetDays) => {
  const dfrom = kyivDate(offsetDays);
  const dto = kyivDate(offsetDays + 1);
  await bot.sendMessage(chatId, `⏳ Перевіряю вільні квартири на ${dfrom}...`);
  try {
    const [{ data }, aparts] = await Promise.all([
      axios.post(`${API_URL}/freeRooms`, { dfrom, dto }, { timeout: 60000 }),
      fetchApartments().catch(() => []),
    ]);
    const rooms = data.data || [];
    const list = rooms.length
      ? rooms.map((r, i) => `${i + 1}. ${escapeHtml(r.name)}`).join("\n")
      : "Немає вільних квартир.";

    // /freeRooms checks every apartment that has a WuBook id
    const total = aparts.filter((r) => r.wubid).length;
    const occupancy =
      total >= rooms.length && total > 0
        ? `\n📈 Завантаженість: <b>${Math.round(((total - rooms.length) / total) * 100)}%</b> (зайнято ${
            total - rooms.length
          } з ${total})`
        : "";

    await bot.sendMessage(
      chatId,
      `🏠 Вільні на ніч ${dfrom} → ${dto}: <b>${rooms.length}</b>${occupancy}\n\n${list}`,
      { parse_mode: "HTML", ...adminMenu }
    );
  } catch (err) {
    console.error("[Admin] freeRooms:", err.message);
    await bot.sendMessage(chatId, "❌ Не вдалося отримати вільні квартири.", adminMenu);
  }
};

const runBroadcast = async (adminChatId, draft) => {
  broadcastRunning = true;
  let sent = 0;
  let failed = 0;
  try {
    const { data } = await axios.get(`${API_URL}/getAllUsers/AllUsers`, { timeout: 15000 });
    const chatIds = [...new Set((data.userIds || []).filter(Boolean))];
    await bot.sendMessage(adminChatId, `📢 Розсилка розпочата: ${chatIds.length} користувачів...`);

    for (const target of chatIds) {
      try {
        await bot.copyMessage(target, draft.chatId, draft.messageId);
        sent++;
      } catch (err) {
        failed++;
      }
      await new Promise((r) => setTimeout(r, 50));
    }

    await bot.sendMessage(
      adminChatId,
      `✅ Розсилку завершено.\nНадіслано: ${sent}\nПомилок: ${failed}`,
      adminMenu
    );
  } catch (err) {
    console.error("[Admin] broadcast:", err.message);
    await bot.sendMessage(adminChatId, "❌ Помилка розсилки.", adminMenu);
  } finally {
    broadcastRunning = false;
  }
};

// Notify all verified admins (e.g. about a new booking request). Never throws.
const notifyAdmins = async (html) => {
  for (const adminId of getAdminIds()) {
    try {
      await bot.sendMessage(adminId, html, {
        parse_mode: "HTML",
        disable_web_page_preview: true,
      });
    } catch (err) {
      console.error(`[Admin] notify ${adminId}:`, err.message);
    }
  }
};

bot.on("message", async (msg) => {
  if (!isPrivate(msg) || !msg.from) return;
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  const text = msg.text;

  if (text === "/admin") {
    if (isAdmin(userId)) return showAdminPanel(chatId);

    pendingAuth.set(userId, Date.now() + PENDING_TTL_MS);
    return bot.sendMessage(
      chatId,
      "Для доступу підтвердіть свій номер телефону кнопкою нижче.",
      {
        reply_markup: {
          keyboard: [[{ text: "📲 Підтвердити номер", request_contact: true }]],
          one_time_keyboard: true,
          resize_keyboard: true,
        },
      }
    );
  }

  if (msg.contact && pendingAuth.has(userId)) {
    const expiresAt = pendingAuth.get(userId);
    pendingAuth.delete(userId);
    const removeKeyboard = { reply_markup: { remove_keyboard: true } };

    // The contact must be the sender's own (not forwarded/someone else's card)
    // and match an allowed phone.
    const ownContact =
      msg.contact.user_id === userId && !msg.forward_date && !msg.forward_origin;
    const phone = normalizePhone(msg.contact.phone_number);

    if (Date.now() > expiresAt || !ownContact || !ADMIN_PHONES.includes(phone)) {
      console.warn(`[Admin] Denied access for userId=${userId}`);
      return bot.sendMessage(chatId, "⛔ Доступ заборонено.", removeKeyboard);
    }

    admins[String(userId)] = { phone, verifiedAt: Date.now() };
    saveAdmins();
    setAdminCommands(chatId);
    console.log(`[Admin] Verified admin userId=${userId}`);
    await bot.sendMessage(chatId, "✅ Доступ підтверджено.", removeKeyboard);
    return showAdminPanel(chatId);
  }

  // Broadcast draft input
  if (awaitingBroadcast.has(userId)) {
    if (!isAdmin(userId)) return awaitingBroadcast.delete(userId);
    if (Date.now() > awaitingBroadcast.get(userId)) return awaitingBroadcast.delete(userId);

    if (text === "/cancel") {
      awaitingBroadcast.delete(userId);
      return bot.sendMessage(chatId, "Розсилку скасовано.", adminMenu);
    }
    if (text && text.startsWith("/")) return;

    awaitingBroadcast.delete(userId);
    broadcastDrafts.set(userId, { chatId, messageId: msg.message_id });
    await bot.sendMessage(chatId, "👀 Попередній перегляд:");
    await bot.copyMessage(chatId, chatId, msg.message_id);
    return bot.sendMessage(chatId, "Надіслати це повідомлення всім користувачам?", {
      reply_markup: JSON.stringify({
        inline_keyboard: [
          [{ text: "✅ Надіслати всім", callback_data: "admin:broadcast_confirm" }],
          [{ text: "❌ Скасувати", callback_data: "admin:broadcast_cancel" }],
        ],
      }),
    });
  }
});

bot.on("callback_query", async (query) => {
  const data = query.data || "";
  if (!data.startsWith("admin:")) return;

  const userId = query.from.id;
  const message = query.message;
  if (!message || message.chat.type !== "private" || !isAdmin(userId)) {
    console.warn(`[Admin] Unauthorized callback "${data}" from userId=${userId}`);
    return;
  }
  const chatId = message.chat.id;

  try {
    switch (data) {
      case "admin:panel":
        return await showAdminPanel(chatId);
      case "admin:stats":
        return await sendStats(chatId);
      case "admin:free_today":
        return await sendFreeRooms(chatId, 0);
      case "admin:free_tomorrow":
        return await sendFreeRooms(chatId, 1);
      case "admin:prices":
        return await sendPrices(chatId);
      case "admin:sales":
        return await sendSales(chatId);
      case "admin:broadcast":
        if (broadcastRunning) {
          return await bot.sendMessage(chatId, "⏳ Розсилка вже виконується.");
        }
        awaitingBroadcast.set(userId, Date.now() + BROADCAST_TTL_MS);
        return await bot.sendMessage(
          chatId,
          "Надішліть повідомлення для розсилки (текст або фото з підписом).\n/cancel — скасувати."
        );
      case "admin:broadcast_confirm": {
        const draft = broadcastDrafts.get(userId);
        broadcastDrafts.delete(userId);
        if (!draft) return await bot.sendMessage(chatId, "Чернетку не знайдено.", adminMenu);
        if (broadcastRunning) {
          return await bot.sendMessage(chatId, "⏳ Розсилка вже виконується.");
        }
        return await runBroadcast(chatId, draft);
      }
      case "admin:broadcast_cancel":
        broadcastDrafts.delete(userId);
        return await bot.sendMessage(chatId, "Розсилку скасовано.", adminMenu);
      case "admin:logout":
        delete admins[String(userId)];
        saveAdmins();
        clearAdminCommands(chatId);
        return await bot.sendMessage(chatId, "🚪 Ви вийшли з адмін-панелі.");
    }
  } catch (err) {
    console.error(`[Admin] ${data}:`, err.message);
  }
});

loadAdmins();

module.exports = { isAdmin, notifyAdmins, escapeHtml };
