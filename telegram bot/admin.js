const fs = require("fs");
const path = require("path");
const axios = require("axios");
const moment = require("moment");
const bot = require("./bot");

const API_URL = "https://royalapart.online/api";

// Phones allowed to become admins (comma-separated in env). Compared by digits only.
const ADMIN_PHONES = (process.env.ADMIN_PHONES || "+380983405578,+380664390205,+380631815240")
  .split(",")
  .map((p) => p.replace(/\D/g, ""))
  .filter(Boolean);

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // re-verify phone every 30 days
const PENDING_TTL_MS = 5 * 60 * 1000; // time to share contact after /admin
const BROADCAST_TTL_MS = 10 * 60 * 1000; // time to send broadcast draft
// Broadcast to all bot users is off unless BROADCAST_ENABLED=true
const BROADCAST_ENABLED = process.env.BROADCAST_ENABLED === "true";

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
      [
        { text: "📅 Календар 14 днів", callback_data: "admin:calendar" },
        { text: "📡 Канали продажів", callback_data: "admin:channels:30" },
      ],
      [
        { text: "📈 Прогноз", callback_data: "admin:fc" },
        { text: "🤖 ML-перевірка цін", callback_data: "admin:ml" },
      ],
      [
        {
          text: BROADCAST_ENABLED ? "📢 Розсилка" : "📢 Розсилка (вимкнено)",
          callback_data: "admin:broadcast",
        },
      ],
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

const fetchOccupancy = async (days) => {
  const { data } = await axios.get(`${API_URL}/adminStats/occupancy`, {
    params: { days },
    timeout: 90000,
  });
  return Array.isArray(data?.days) ? data.days : [];
};

const bar = (rate) => {
  const filled = Math.max(0, Math.min(10, Math.round(rate / 10)));
  return "█".repeat(filled) + "░".repeat(10 - filled);
};

const sendCalendar = async (chatId) => {
  await bot.sendMessage(chatId, "⏳ Рахую завантаженість на 14 днів...");
  try {
    const days = await fetchOccupancy(14);
    if (!days.length) {
      return await bot.sendMessage(chatId, "Немає даних про завантаженість.", adminMenu);
    }
    const rows = days.map((d) => {
      const date = moment(d.date, "YYYY-MM-DD");
      const price = d.avgPrice ? ` ${Math.round(d.avgPrice / 100) / 10}k` : "";
      return `${WEEKDAYS[date.day()]} ${date.format("DD.MM")} ${bar(d.rate)} ${String(Math.round(d.rate)).padStart(3)}% ${String(d.free).padStart(2)} віл.${price}`;
    });
    const avgRate = days.reduce((s, d) => s + d.rate, 0) / days.length;
    const weakest = days
      .slice()
      .sort((a, b) => a.rate - b.rate)
      .slice(0, 3)
      .map((d) => {
        const date = moment(d.date, "YYYY-MM-DD");
        return `${WEEKDAYS[date.day()]} ${date.format("DD.MM")} — ${Math.round(d.rate)}% (${d.free} віл.)`;
      });
    const lines = [
      `📅 <b>Завантаженість ${moment(days[0].date).format("DD.MM")} – ${moment(days[days.length - 1].date).format("DD.MM")}</b>`,
      `Середня: <b>${Math.round(avgRate)}%</b> · квартир у продажу: ${days[0].total}`,
      "",
      `<pre>${rows.join("\n")}</pre>`,
      "📉 Найслабші дні (кандидати на знижку):",
      ...weakest.map((w) => `• ${w}`),
      "",
      "<i>віл. — вільних квартир, k — середня ціна, тис. грн</i>",
    ];
    await bot.sendMessage(chatId, lines.join("\n"), { parse_mode: "HTML", ...adminMenu });
  } catch (err) {
    console.error("[Admin] calendar:", err.message);
    await bot.sendMessage(chatId, "❌ Не вдалося отримати завантаженість.", adminMenu);
  }
};

const channelsMenu = (days) => ({
  reply_markup: JSON.stringify({
    inline_keyboard: [
      [30, 90].map((d) => ({
        text: `${d === days ? "• " : ""}${d} днів`,
        callback_data: `admin:channels:${d}`,
      })),
      [{ text: "🔐 Адмін-панель", callback_data: "admin:panel" }],
    ],
  }),
});

const sendChannels = async (chatId, days) => {
  await bot.sendMessage(chatId, `⏳ Аналізую бронювання за ${days} днів...`);
  try {
    const { data } = await axios.get(`${API_URL}/adminStats/channels`, {
      params: { days },
      timeout: 180000,
    });
    const t = data.totals || {};
    const cur = (n) =>
      data.currency === "UAH" ? money(n) : `${Math.round(n).toLocaleString("uk-UA")} ${escapeHtml(data.currency)}`;
    const lines = [
      `📡 <b>Канали продажів</b> (${moment(data.from).format("DD.MM")} – ${moment(data.to).format("DD.MM")}, за датою бронювання)`,
      "",
      `Бронювань: <b>${t.bookings || 0}</b> · підтв. ${t.confirmed || 0} · скас. ${t.cancelled || 0} (${t.cancelRate || 0}%)${
        t.pending ? ` · очікують ${t.pending}` : ""
      }`,
      `Дохід: <b>${cur(t.revenue || 0)}</b> · ночей ${t.nights || 0}${t.adr ? ` · ADR ${cur(t.adr)}` : ""}`,
    ];
    const channels = Array.isArray(data.channels) ? data.channels : [];
    if (!channels.length) lines.push("", "Бронювань за період немає.");
    channels.slice(0, 15).forEach((c, i) => {
      const share = t.revenue ? Math.round((c.revenue / t.revenue) * 100) : 0;
      const details = [
        c.adr ? `ADR ${cur(c.adr)}` : null,
        `скас. ${c.cancelRate}%`,
        c.avgLeadDays !== null && c.avgLeadDays !== undefined ? `бронюють за ${c.avgLeadDays} дн.` : null,
      ].filter(Boolean);
      lines.push(
        "",
        `${i + 1}. <b>${escapeHtml(c.name)}</b> — ${c.bookings} брон. · ${cur(c.revenue)} (${share}%)`,
        `   ${details.join(" · ")}`
      );
    });
    await bot.sendMessage(chatId, lines.join("\n"), { parse_mode: "HTML", ...channelsMenu(days) });
  } catch (err) {
    console.error("[Admin] channels:", err.message);
    await bot.sendMessage(chatId, "❌ Не вдалося отримати статистику каналів.", adminMenu);
  }
};

// ----- ML price check (results written daily by the ml container) -----

const ML_RESULTS_FILE = process.env.ML_RESULTS_FILE || path.join(__dirname, "..", "ml-data", "price_check.json");
const ML_WATCH_INTERVAL_MS = 10 * 60 * 1000;

const readMlResults = () => {
  try {
    const data = JSON.parse(fs.readFileSync(ML_RESULTS_FILE, "utf8"));
    return data && Array.isArray(data.results) ? data : null;
  } catch (_e) {
    return null;
  }
};

const buildMlMessage = (data, freeToday) => {
  const ref = (r) => (r.optimal > 0 ? r.optimal : r.predicted);
  const free = (r) => (freeToday.has(r.room) ? " 🟡 вільна" : "");
  const fmt = (r) => `• ${escapeHtml(r.room)} — ${money(r.price)} → ~${money(ref(r))}${free(r)}`;

  // Free-today apartments first (that's where a price change matters), then by size of the gap
  const byFreeThenGap = (gap) => (a, b) =>
    Number(freeToday.has(b.room)) - Number(freeToday.has(a.room)) || gap(b) - gap(a);
  const low = data.results
    .filter((r) => r.statusCode === 0 && ref(r) > r.price)
    .sort(byFreeThenGap((r) => ref(r) - r.price));
  const high = data.results
    .filter((r) => r.statusCode === 2 && ref(r) < r.price)
    .sort(byFreeThenGap((r) => r.price - ref(r)));
  const normal = data.results.length - low.length - high.length;
  const notableFree = [...low, ...high].filter((r) => freeToday.has(r.room)).length;

  const updated = moment(data.generatedAt);
  const lines = [
    `🤖 <b>ML-перевірка цін</b> на ${escapeHtml(data.date)} (оновлено ${
      updated.isValid() ? updated.format("DD.MM HH:mm") : "-"
    })`,
    `Перевірено: ${data.results.length} · ✅ норм. ${normal} · 🔻 занижені ${low.length} · 🔺 завищені ${high.length}${
      data.errors ? ` · помилок ${data.errors}` : ""
    }`,
  ];
  if (low.length) lines.push("", "🔻 <b>Нижче ринку</b> (можна підняти):", ...low.slice(0, 10).map(fmt));
  if (high.length) lines.push("", "🔺 <b>Вище ринку</b> (ризик не продати):", ...high.slice(0, 10).map(fmt));
  if (!low.length && !high.length) lines.push("", "Усі ціни в нормі 👍");
  lines.push("", "<i>→ ~ ціна, яку радить модель. 🟡 — вільна сьогодні</i>");
  return { text: lines.join("\n"), notableFree };
};

const freeTodaySet = async () => {
  try {
    const [today] = await fetchOccupancy(1);
    return new Set(today?.freeRooms || []);
  } catch (_e) {
    return new Set();
  }
};

const sendMlCheck = async (chatId) => {
  const data = readMlResults();
  if (!data) {
    return bot.sendMessage(
      chatId,
      "🤖 Результатів ML-перевірки ще немає. Вона запускається щодня о 09:00 (і після деплою).",
      adminMenu
    );
  }
  const { text } = buildMlMessage(data, await freeTodaySet());
  return bot.sendMessage(chatId, text, { parse_mode: "HTML", ...adminMenu });
};

// ----- Forecast (python/forecast_engine.py, written daily by the ml container) -----

const FORECAST_FILE =
  process.env.ML_FORECAST_FILE || path.join(path.dirname(ML_RESULTS_FILE), "forecast.json");

const readForecast = () => {
  try {
    const data = JSON.parse(fs.readFileSync(FORECAST_FILE, "utf8"));
    return data && Array.isArray(data.days) ? data : null;
  } catch (_e) {
    return null;
  }
};

const forecastMenu = {
  reply_markup: JSON.stringify({
    inline_keyboard: [
      [
        { text: "📈 Завантаженість", callback_data: "admin:fc:occ" },
        { text: "💰 Дохід", callback_data: "admin:fc:rev" },
      ],
      [
        { text: "🏁 Темп vs минулий рік", callback_data: "admin:fc:pace" },
        { text: "💡 Ціни", callback_data: "admin:fc:prices" },
      ],
      [{ text: "🎯 Точність прогнозу", callback_data: "admin:fc:acc" }],
      [{ text: "🔐 Адмін-панель", callback_data: "admin:panel" }],
    ],
  }),
};

const dayLabel = (iso) => {
  const d = moment(iso, "YYYY-MM-DD");
  return `${WEEKDAYS[d.day()]} ${d.format("DD.MM")}`;
};
const pct = (v) => (v === null || v === undefined ? "—" : `${Math.round(v)}%`);
const signed = (v) => (v > 0 ? `+${v}` : `${v}`);

// █ already booked · ▒ expected pickup · ░ free
const forecastBar = (otbRate, fcRate) => {
  const booked = Math.max(0, Math.min(10, Math.round(otbRate / 10)));
  const total = Math.max(booked, Math.min(10, Math.round(fcRate / 10)));
  return "█".repeat(booked) + "▒".repeat(total - booked) + "░".repeat(10 - total);
};

const forecastHeader = (fc) =>
  `<i>Прогноз від ${moment(fc.generatedAt).format("DD.MM HH:mm")} · ${fc.reservations} бронювань у даних</i>`;

const noForecast = (chatId) =>
  bot.sendMessage(
    chatId,
    "📈 Прогнозу ще немає. Він рахується щодня о 09:00 після синхронізації бронювань із Zak.",
    adminMenu
  );

const sendForecastMenu = (chatId) => {
  const fc = readForecast();
  if (!fc) return noForecast(chatId);
  const s = fc.summary;
  const lines = [
    "📈 <b>Прогноз</b>",
    "",
    `7 днів: <b>~${pct(s.next7.forecastRate)}</b> завантаженість · ~${money(s.next7.forecastRevenue)}`,
    `30 днів: <b>~${pct(s.next30.forecastRate)}</b> · ~${money(s.next30.forecastRevenue)}`,
    "",
    forecastHeader(fc),
  ];
  return bot.sendMessage(chatId, lines.join("\n"), { parse_mode: "HTML", ...forecastMenu });
};

const sendForecastOccupancy = (chatId) => {
  const fc = readForecast();
  if (!fc) return noForecast(chatId);
  const days = fc.days.slice(0, 30);
  const rows = days.map((d) => {
    const otbRate = d.capacity ? (d.otbRooms / d.capacity) * 100 : 0;
    return `${dayLabel(d.date)} ${forecastBar(otbRate, d.forecastRate)} ${String(Math.round(otbRate)).padStart(3)}→${String(Math.round(d.forecastRate)).padStart(3)}%`;
  });
  const s = fc.summary;
  const n7 = days.slice(0, 7);
  const lines = [
    "📈 <b>Прогноз завантаженості, 30 днів</b>",
    `7 днів: <b>~${pct(s.next7.forecastRate)}</b> (діапазон ${pct(Math.min(...n7.map((d) => d.lowRate)))}–${pct(Math.max(...n7.map((d) => d.highRate)))}) · вже заброньовано ${s.next7.otbRooms} ночей`,
    `30 днів: <b>~${pct(s.next30.forecastRate)}</b> · вже заброньовано ${s.next30.otbRooms} з ~${s.next30.forecastRooms} очікуваних ночей`,
    "",
    `<pre>${rows.join("\n")}</pre>`,
    "<i>█ вже заброньовано · ▒ очікувані бронювання · ░ вільно\nзаброньовано→прогноз, % квартир</i>",
    forecastHeader(fc),
  ];
  return bot.sendMessage(chatId, lines.join("\n"), { parse_mode: "HTML", ...forecastMenu });
};

const sendForecastRevenue = (chatId) => {
  const fc = readForecast();
  if (!fc) return noForecast(chatId);
  const s = fc.summary;
  const m = s.month;
  const monthName = moment(`${m.month}-01`).format("MM.YYYY");
  const adr = (w) => (w.forecastRooms ? money(w.forecastRevenue / w.forecastRooms) : "—");
  const lines = [
    "💰 <b>Прогноз доходу</b>",
    "",
    `7 днів: <b>~${money(s.next7.forecastRevenue)}</b> · вже заброньовано ${money(s.next7.otbRevenue)} · ADR ~${adr(s.next7)}`,
    `30 днів: <b>~${money(s.next30.forecastRevenue)}</b> · вже ${money(s.next30.otbRevenue)} · ADR ~${adr(s.next30)}`,
    `60 днів: <b>~${money(s.next60.forecastRevenue)}</b> · вже ${money(s.next60.otbRevenue)}`,
    "",
    `📆 Місяць ${monthName}: вже прожито <b>${money(m.realizedRevenue)}</b> (${m.realizedRooms} ночей)`,
    `+ прогноз на решту місяця ~${money(m.remaining.forecastRevenue)}`,
    `= <b>~${money(m.realizedRevenue + m.remaining.forecastRevenue)}</b> за місяць`,
    "",
    "<i>Дохід — сума за проживання з Zak. Очікувані бронювання оцінено за цінами останніх «пізніх» бронювань для цього дня тижня з урахуванням сезону.</i>",
    forecastHeader(fc),
  ];
  return bot.sendMessage(chatId, lines.join("\n"), { parse_mode: "HTML", ...forecastMenu });
};

const sendForecastPace = (chatId) => {
  const fc = readForecast();
  if (!fc) return noForecast(chatId);
  const line = (label, w) => {
    if (w.otbRoomsLySameLead === null || w.otbRoomsLySameLead === undefined) return `${label}: немає даних за минулий рік`;
    const diff = w.otbRooms - w.otbRoomsLySameLead;
    const rel = w.otbRoomsLySameLead ? Math.round((diff / w.otbRoomsLySameLead) * 100) : null;
    const icon = diff >= 0 ? "🟢" : "🔴";
    return `${icon} ${label}: <b>${w.otbRooms}</b> ночей vs ${w.otbRoomsLySameLead} минулого року (${signed(diff)}${rel !== null ? `, ${signed(rel)}%` : ""})${
      w.finalRoomsLy !== null && w.finalRoomsLy !== undefined ? `\n    у підсумку минулого року: ${w.finalRoomsLy}, прогноз зараз: ~${w.forecastRooms}` : ""
    }`;
  };
  const s = fc.summary;
  const lines = [
    "🏁 <b>Темп бронювань vs минулий рік</b>",
    "<i>Заброньовано зараз vs заброньовано рік тому на ті самі дні тижня за стільки ж днів до заїзду</i>",
    "",
    line("7 днів", s.next7),
    line("30 днів", s.next30),
    line("60 днів", s.next60),
    "",
    forecastHeader(fc),
  ];
  return bot.sendMessage(chatId, lines.join("\n"), { parse_mode: "HTML", ...forecastMenu });
};

const sendForecastPrices = (chatId) => {
  const fc = readForecast();
  if (!fc) return noForecast(chatId);
  const recs = (fc.priceRecommendations || []).filter(
    (r) => moment(r.date).diff(moment(fc.asOf), "days") < 14
  );
  const lines = ["💡 <b>Рекомендації цін</b> (вільні квартири, 14 днів)"];
  if (!recs.length) {
    lines.push("", "Ціни відповідають прогнозу попиту 👍");
  } else {
    const shown = recs.slice().sort((a, b) => Math.abs(b.diffPct) - Math.abs(a.diffPct)).slice(0, 20);
    shown.sort((a, b) => a.date.localeCompare(b.date) || Math.abs(b.diffPct) - Math.abs(a.diffPct));
    let current = null;
    for (const r of shown) {
      if (r.date !== current) {
        current = r.date;
        const day = fc.days.find((d) => d.date === r.date);
        lines.push("", `<b>${dayLabel(r.date)}</b> · прогноз ${pct(day && day.forecastRate)}`);
      }
      lines.push(
        `${r.diffPct > 0 ? "🔺" : "🔻"} ${escapeHtml(r.room)}: ${money(r.current)} → <b>${money(r.recommended)}</b> (${signed(r.diffPct)}%)`
      );
    }
    if (recs.length > shown.length) lines.push("", `…і ще ${recs.length - shown.length}`);
  }
  lines.push(
    "",
    "<i>Порівняння з іншими квартирами: скільки гості реально платили за 120 днів vs ваша поточна ціна, плюс прогноз попиту на цю ніч. Це підказка, а не автоматична зміна цін.</i>",
    forecastHeader(fc)
  );
  return bot.sendMessage(chatId, lines.join("\n"), { parse_mode: "HTML", ...forecastMenu });
};

const FEATURE_LABELS = {
  lead: "днів до заїзду",
  otb_rate: "вже заброньовано",
  dow: "день тижня",
  month: "місяць",
  doy_sin: "сезон",
  doy_cos: "сезон",
  weekend: "Пт/Сб",
  holiday: "свята",
  festive: "новорічний сезон",
  ly_final: "минулий рік",
  ly_otb_same_lead: "темп минулого року",
  recent_level_28d: "завантаженість останніх 4 тижнів",
  recent_pickup_14d: "недавній добір бронювань",
  capacity: "кількість квартир",
  recent_level_7d: "завантаженість останнього тижня",
};

const sendForecastAccuracy = (chatId) => {
  const fc = readForecast();
  if (!fc) return noForecast(chatId);
  const a = fc.accuracy;
  const m = a.maePts;
  const lines = [
    "🎯 <b>Точність прогнозу</b>",
    `<i>Перевірка на минулих датах ${moment(a.testFrom).format("DD.MM.YY")}–${moment(a.testTo).format("DD.MM.YY")} (${a.samples.toLocaleString("uk-UA")} прогнозів), модель не бачила цих даних</i>`,
    "",
    `Середня помилка завантаженості:`,
    `• <b>наша модель: ${m.model} п.п.</b> (~${a.maeRooms.model} кв. на день)`,
    ...(m.recent7dAverage !== undefined ? [`• «як останні 7 днів»: ${m.recent7dAverage} п.п.`] : []),
    `• «середнє за 4 тижні»: ${m.recent28dAverage} п.п.`,
    `• «як минулого року»: ${m.lastYearSameWeekday} п.п.`,
    `• «заброньовано + середній добір»: ${m.otbPlusAvgPickup} п.п.`,
    "",
    "За горизонтом (модель / «як останні 7 днів»):",
    ...a.byLead.map((b) => `• ${b.leads} дн.: <b>${b.model}</b> / ${b.recent7d ?? b.pickupBaseline} п.п.`),
  ];
  // capacity mostly reflects how the business grew over time — not useful to show
  const fi = (fc.featureImportance || []).filter((f) => f.maeIncreasePts > 0 && f.feature !== "capacity");
  if (fi.length) {
    const labels = [...new Set(fi.map((f) => FEATURE_LABELS[f.feature] || f.feature))];
    lines.push("", `Найважливіше для прогнозу: ${labels.slice(0, 4).join(", ")}`);
  }
  lines.push("", forecastHeader(fc));
  return bot.sendMessage(chatId, lines.join("\n"), { parse_mode: "HTML", ...forecastMenu });
};

// Morning summary: pushed once when a new forecast appears
const buildMorningSummary = (fc) => {
  const s = fc.summary;
  const today = fc.days[0];
  const soon = (fc.priceRecommendations || []).filter((r) => moment(r.date).diff(moment(fc.asOf), "days") < 3);
  const pace = s.next30.otbRoomsLySameLead
    ? Math.round(((s.next30.otbRooms - s.next30.otbRoomsLySameLead) / s.next30.otbRoomsLySameLead) * 100)
    : null;
  const lines = [
    "☀️ <b>Ранковий прогноз</b>",
    "",
    `Сьогодні: заброньовано ${today.otbRooms} з ${today.capacity}, прогноз ~${pct(today.forecastRate)}`,
    `7 днів: ~${pct(s.next7.forecastRate)} · ~${money(s.next7.forecastRevenue)}`,
    `30 днів: ~${pct(s.next30.forecastRate)} · ~${money(s.next30.forecastRevenue)}`,
  ];
  if (pace !== null) lines.push(`Темп vs минулий рік (30 дн.): ${pace >= 0 ? "🟢" : "🔴"} ${signed(pace)}%`);
  if (soon.length) {
    lines.push("", `💡 Ціни на найближчі 3 дні — ${soon.length} рекомендацій, напр.:`);
    soon
      .slice()
      .sort((a, b) => Math.abs(b.diffPct) - Math.abs(a.diffPct))
      .slice(0, 3)
      .forEach((r) =>
        lines.push(`• ${dayLabel(r.date)} ${escapeHtml(r.room)}: ${money(r.current)} → ${money(r.recommended)}`)
      );
  }
  return lines.join("\n");
};

let lastForecastRun = readForecast()?.generatedAt || null;
setInterval(async () => {
  const fc = readForecast();
  if (!fc || fc.generatedAt === lastForecastRun) return;
  lastForecastRun = fc.generatedAt;
  if (!getAdminIds().length) return;
  try {
    await notifyAdmins(buildMorningSummary(fc));
  } catch (err) {
    console.error("[Admin] morning summary:", err.message);
  }
}, ML_WATCH_INTERVAL_MS).unref();

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
    if (!BROADCAST_ENABLED || !isAdmin(userId)) return awaitingBroadcast.delete(userId);
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
    // Also blocks old "Надіслати всім" buttons still visible in chat history
    if (data.startsWith("admin:broadcast") && !BROADCAST_ENABLED) {
      awaitingBroadcast.delete(userId);
      broadcastDrafts.delete(userId);
      return await bot.sendMessage(chatId, "📢 Розсилка тимчасово вимкнена.", adminMenu);
    }
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
      case "admin:calendar":
        return await sendCalendar(chatId);
      case "admin:channels:30":
        return await sendChannels(chatId, 30);
      case "admin:channels:90":
        return await sendChannels(chatId, 90);
      case "admin:ml":
        return await sendMlCheck(chatId);
      case "admin:fc":
        return await sendForecastMenu(chatId);
      case "admin:fc:occ":
        return await sendForecastOccupancy(chatId);
      case "admin:fc:rev":
        return await sendForecastRevenue(chatId);
      case "admin:fc:pace":
        return await sendForecastPace(chatId);
      case "admin:fc:prices":
        return await sendForecastPrices(chatId);
      case "admin:fc:acc":
        return await sendForecastAccuracy(chatId);
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
