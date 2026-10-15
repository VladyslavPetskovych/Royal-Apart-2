// Zak (WuBook PMS) API client — read-only reservation fetching.
// Docs: https://tdocs.wubook.net/kapi/reservation.html (fetch_reservations)
// Zak may block clients that generate too much traffic, so calls are throttled.
const axios = require("axios");

const BASE = "https://kapi.wubook.net/kp";
const PAGE_LIMIT = 64; // max allowed by Zak
const THROTTLE_MS = Number(process.env.ZAK_THROTTLE_MS) || 1000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let lastCall = 0;
const throttle = async () => {
  const wait = lastCall + THROTTLE_MS - Date.now();
  if (wait > 0) await sleep(wait);
  lastCall = Date.now();
};

const post = async (path, form, apiKey = process.env.WUDOO_API_KEY) => {
  if (!apiKey) throw new Error("WUDOO_API_KEY is not set");
  await throttle();
  const { data } = await axios.post(`${BASE}${path}`, new URLSearchParams(form), {
    headers: { "x-api-key": apiKey },
    timeout: 60000,
  });
  if (data && data.error) throw new Error(`Zak ${path}: ${String(data.error).slice(0, 200)}`);
  return data && data.data;
};

const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

// Keep only what analytics/forecasting needs — no customer ids, names or door codes
const minimize = (r) => ({
  id: r.id,
  code: r.id_human,
  status: r.status,
  created: r.created,
  lastStatusDate: r.last_status_date || null,
  channel: (r.origin && r.origin.channel) || "--",
  agency: typeof r.agency === "string" ? r.agency : null,
  total: num(r.price && r.price.total),
  roomsTotal: num(r.price && r.price.rooms && r.price.rooms.total),
  currency: (r.price && r.price.rooms && r.price.rooms.currency) || null,
  rooms: (Array.isArray(r.rooms) ? r.rooms : []).map((room) => ({
    roomType: room.id_zak_room_type,
    room: room.id_zak_room,
    dfrom: room.dfrom,
    dto: room.dto,
    total: num(room.price && room.price.total),
    adults: num(room.occupancy && room.occupancy.adults),
    children:
      num(room.occupancy && room.occupancy.children) +
      num(room.occupancy && room.occupancy.teens) +
      num(room.occupancy && room.occupancy.babies),
  })),
});

/**
 * Fetch all reservations matching a filter, page by page.
 * filters: { created | arrival | departure: { from: "dd/mm/yyyy", to: "dd/mm/yyyy" } }
 * onPage(minimizedReservations) is awaited for every page.
 */
const fetchReservations = async (filters, onPage) => {
  let offset = 0;
  let total = 0;
  for (;;) {
    const data = await post("/reservations/fetch_reservations", {
      filters: JSON.stringify({ ...filters, pager: { limit: PAGE_LIMIT, offset } }),
    });
    const list = (data && data.reservations) || [];
    if (list.length) await onPage(list.map(minimize));
    total += list.length;
    if (list.length < PAGE_LIMIT) return total;
    offset += PAGE_LIMIT;
  }
};

module.exports = { fetchReservations, minimize, PAGE_LIMIT };
