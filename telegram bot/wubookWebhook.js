// WuBook Wired webhook (communication:notify) -> Telegram alerts for verified admins only.
// https://wired-json.wubook.net/reference/
const crypto = require("crypto");
const express = require("express");
const moment = require("moment");
const { notifyAdmins, escapeHtml } = require("./admin");

const PORT = Number(process.env.WEBHOOK_PORT) || 3001;
const SECRET = process.env.WUBOOK_WEBHOOK_SECRET || "";
const PROPERTY_ID = process.env.WUBOOK_PROPERTY_ID || ""; // optional extra check

const DEDUPE_TTL_MS = 24 * 60 * 60 * 1000;
const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX = 60; // requests per IP per window

const EVENTS = {
  reservation_new: "🆕 <b>Нове бронювання</b>",
  reservation_confirmed_property: "✅ <b>Бронювання підтверджено</b> (обʼєктом)",
  reservation_confirmed_guest_credit_card: "✅ <b>Бронювання підтверджено</b> (карткою гостя)",
  reservation_confirmed_guest_paid: "✅💰 <b>Бронювання оплачено</b>",
  reservation_canceled_property: "❌ <b>Бронювання скасовано</b> (обʼєктом)",
  reservation_canceled_guest: "❌ <b>Бронювання скасовано</b> (гостем)",
  reservation_canceled_ota: "❌ <b>Бронювання скасовано</b> (OTA)",
};

const seen = new Map(); // `${type}:${reservation_id}` -> timestamp
const hits = new Map(); // ip -> { count, start }

const sha256 = (value) => crypto.createHash("sha256").update(String(value)).digest();
const secretMatches = (candidate) =>
  crypto.timingSafeEqual(sha256(candidate), sha256(SECRET));

const clip = (value, max = 500) => {
  const text = String(value ?? "").trim();
  return escapeHtml(text.length > max ? `${text.slice(0, max)}…` : text);
};

const formatDate = (date) => {
  const m = moment(date, "YYYY-MM-DD", true);
  return m.isValid() ? m.format("DD.MM.YYYY") : clip(date, 30);
};

const rateLimited = (ip) => {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now - entry.start > RATE_WINDOW_MS) {
    hits.set(ip, { count: 1, start: now });
    return false;
  }
  entry.count++;
  return entry.count > RATE_MAX;
};

const isDuplicate = (key) => {
  const now = Date.now();
  for (const [k, ts] of seen) {
    if (now - ts > DEDUPE_TTL_MS) seen.delete(k);
  }
  if (seen.has(key)) return true;
  seen.set(key, now);
  return false;
};

const buildMessage = ({ communication, reservation, type_specific_data: extra = {} }) => {
  const guest = reservation.guest || {};
  const source = reservation.source || {};
  const places = Array.isArray(reservation.bookable_places) ? reservation.bookable_places : [];

  const arrival = moment(reservation.arrival_date, "YYYY-MM-DD", true);
  const departure = moment(reservation.departure_date, "YYYY-MM-DD", true);
  const nights =
    arrival.isValid() && departure.isValid() ? departure.diff(arrival, "days") : null;

  const phones = (guest.phone_numbers || []).slice(0, 3).map((p) => clip(p, 30)).join(", ");
  const emails = [guest.email, ...(guest.emails || [])].filter(Boolean);
  const placesText = places
    .slice(0, 10)
    .map((p) => {
      const persons = p.occupancy?.persons?.total;
      return `${clip(p.how_many, 5)}× ${clip(p.name, 100)}${persons ? ` (${clip(persons, 5)} гост.)` : ""}`;
    })
    .join("\n");
  const undistributed = reservation.additional_occupancy_info?.persons?.not_distributed_total;

  const details = [
    `🏷 Джерело: ${clip(source.name || "-", 100)}${
      source.source_reservation_id ? ` (#${clip(source.source_reservation_id, 50)})` : ""
    }`,
    `🆔 WuBook: ${clip(reservation.reservation_id, 30)}`,
    `👤 Гість: ${clip(`${guest.first_name || ""} ${guest.last_name || ""}`, 100) || "-"}`,
    phones && `📞 ${phones}`,
    emails.length && `✉️ ${clip([...new Set(emails)].slice(0, 2).join(", "), 200)}`,
    `📅 ${formatDate(reservation.arrival_date)} → ${formatDate(reservation.departure_date)}${
      nights !== null ? ` (${nights} ноч.)` : ""
    }`,
    placesText && `🏠 ${placesText}`,
    undistributed && `👥 Гостей: ${clip(undistributed, 5)}`,
    extra.payment && `💰 Оплата: ${clip(extra.payment.amount, 20)} ${clip(extra.payment.currency, 5)}`,
    extra.reason && `ℹ️ Причина: ${clip(extra.reason)}`,
    extra.notes && `📝 ${clip(extra.notes)}`,
  ];
  return `${EVENTS[communication.type]}\n\n${details.filter(Boolean).join("\n")}`;
};

const isValidNotification = (body) => {
  const params = body?.params;
  return (
    body?.jsonrpc === "2.0" &&
    body.method === "communication:notify" &&
    params &&
    typeof params.communication?.type === "string" &&
    params.reservation &&
    ["string", "number"].includes(typeof params.reservation.reservation_id)
  );
};

const startWebhook = () => {
  if (SECRET.length < 32) {
    console.warn("[WuBook webhook] WUBOOK_WEBHOOK_SECRET missing or shorter than 32 chars — webhook disabled");
    return;
  }

  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", "loopback, uniquelocal"); // nginx in the docker network

  app.post(
    "/wubook-webhook/:secret",
    (req, res, next) => {
      if (rateLimited(req.ip)) return res.sendStatus(429);
      if (!secretMatches(req.params.secret)) {
        console.warn(`[WuBook webhook] Rejected request with invalid secret from ${req.ip}`);
        return res.sendStatus(404);
      }
      next();
    },
    express.json({ limit: "256kb", type: () => true }),
    async (req, res) => {
      const body = req.body;
      const ok = (result = {}) => res.status(200).json({ jsonrpc: "2.0", id: body?.id ?? null, result });

      // Other Wired notifications (OTA messages, feedback...) — acknowledge so Wired does not retry.
      if (body?.method !== "communication:notify") return ok();
      if (!isValidNotification(body)) return res.sendStatus(400);

      const { communication, reservation, property } = body.params;
      if (PROPERTY_ID && String(property?.property_id) !== PROPERTY_ID) {
        console.warn(`[WuBook webhook] Unexpected property_id ${property?.property_id}`);
        return res.sendStatus(403);
      }
      if (!EVENTS[communication.type]) return ok();

      // Wired may send one notification per target (guest/property/corporate) and retries on failure.
      if (isDuplicate(`${communication.type}:${reservation.reservation_id}`)) return ok();

      console.log(`[WuBook webhook] ${communication.type} reservation=${reservation.reservation_id}`);
      try {
        await notifyAdmins(buildMessage(body.params));
      } catch (err) {
        console.error("[WuBook webhook] notify failed:", err.message);
      }
      return ok();
    }
  );

  app.use((req, res) => res.sendStatus(404));
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => res.sendStatus(err.status || 400));

  app.listen(PORT, () => console.log(`[WuBook webhook] Listening on :${PORT}`));
};

startWebhook();

module.exports = { buildMessage };
