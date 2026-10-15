// Read-only statistics for the Telegram admin panel. Mounted behind requireAdmin.
// Only aggregates leave this route — no guest personal data.
const express = require("express");
const mongoose = require("../db");
const { fetchRoomsValues, fetchBookings, getChannelsInfo } = require("../services/wubookXmlrpc");
const ZakReservation = require("../models/zakReservation");
const Rooms = require("../models/rooms");
const zakSync = require("../services/zakSync");

const router = express.Router();

const NEGOTIABLE_PRICE = 10000; // placeholder prices for "long-term only"
const WUBOOK_PAGE_LIMIT = 120;
const DAY_MS = 24 * 60 * 60 * 1000;

// ---------- helpers ----------

// Today's date in Kyiv as a UTC-midnight Date
const kyivToday = () => {
  const [d, m, y] = new Date()
    .toLocaleDateString("en-GB", { timeZone: "Europe/Kyiv" })
    .split("/")
    .map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};
const addDays = (date, n) => new Date(date.getTime() + n * DAY_MS);
const toWubook = (date) =>
  `${String(date.getUTCDate()).padStart(2, "0")}/${String(date.getUTCMonth() + 1).padStart(2, "0")}/${date.getUTCFullYear()}`;
const toIso = (date) => date.toISOString().slice(0, 10);

// "dd/mm/yyyy" -> UTC Date | null
const parseWubookDate = (value) => {
  const match = String(value || "").match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  return match ? new Date(Date.UTC(+match[3], +match[2] - 1, +match[1])) : null;
};
// date_received_time may be a unix timestamp or a date string
const parseReceived = (booking) => {
  const raw = booking.date_received_time ?? booking.date_received;
  const n = Number(raw);
  if (Number.isFinite(n) && n > 0) return new Date(n > 1e12 ? n : n * 1000);
  return parseWubookDate(raw);
};

const clampInt = (value, min, max, fallback) => {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};

// Small TTL cache with single-flight, so repeated clicks don't hammer WuBook
const cache = new Map(); // key -> { at, promise }
const cached = (key, ttlMs, compute) => {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.promise;
  const promise = compute().catch((err) => {
    cache.delete(key);
    throw err;
  });
  cache.set(key, { at: Date.now(), promise });
  return promise;
};

// wdid -> apartment name (same mapping as /analis and /forecast)
const roomNames = () =>
  cached("roomNames", 10 * 60 * 1000, async () => {
    const db = mongoose.connection.useDb("apartments");
    const rooms = await db.collection("wodoo_aparts").find({}, { projection: { wdid: 1, name: 1 } }).toArray();
    const map = {};
    rooms.forEach((r) => {
      if (r.wdid) map[String(r.wdid).trim()] = r.name;
    });
    return map;
  });

// ---------- GET /adminStats/occupancy?days=14 ----------

const buildOccupancy = async (days) => {
  const start = kyivToday();
  const end = addDays(start, days - 1);
  const [values, names] = await Promise.all([
    fetchRoomsValues(toWubook(start), toWubook(end)),
    roomNames().catch(() => ({})),
  ]);

  const result = Array.from({ length: days }, (_, i) => ({
    date: toIso(addDays(start, i)),
    total: 0,
    occupied: 0,
    free: 0,
    closed: 0,
    rate: 0,
    avgPrice: null,
    freeRooms: [],
  }));
  const priceSums = result.map(() => ({ sum: 0, n: 0 }));

  for (const [roomId, dayValues] of Object.entries(values || {})) {
    if (!Array.isArray(dayValues)) continue;
    const name = names[String(roomId).trim()] || `ID ${roomId}`;
    dayValues.slice(0, days).forEach((v, i) => {
      const day = result[i];
      if (!v || typeof v !== "object") return;
      if (Number(v.closed) === 1) {
        day.closed++;
        return;
      }
      day.total++;
      if (Number(v.avail) > 0) {
        day.free++;
        day.freeRooms.push(name);
      } else {
        day.occupied++;
      }
      const price = Number(v.price);
      if (price > 0 && price < NEGOTIABLE_PRICE) {
        priceSums[i].sum += price;
        priceSums[i].n++;
      }
    });
  }

  result.forEach((day, i) => {
    day.rate = day.total ? Math.round((day.occupied / day.total) * 1000) / 10 : 0;
    day.avgPrice = priceSums[i].n ? Math.round(priceSums[i].sum / priceSums[i].n) : null;
    day.freeRooms.sort((a, b) => a.localeCompare(b, "uk"));
  });

  return { success: true, from: toIso(start), to: toIso(end), days: result };
};

router.get("/occupancy", async (req, res) => {
  const days = clampInt(req.query.days, 1, 31, 14);
  try {
    res.json(await cached(`occupancy:${days}`, 5 * 60 * 1000, () => buildOccupancy(days)));
  } catch (err) {
    console.error("[adminStats] occupancy:", err.message);
    res.status(502).json({ success: false, error: "WuBook request failed" });
  }
});

// ---------- GET /adminStats/channels?days=30 ----------

// Fetch all reservations created in [from, to], splitting windows that hit the page limit
const fetchBookingsRange = async (from, to) => {
  const all = new Map();
  const load = async (a, b) => {
    const rows = await fetchBookings(toWubook(a), toWubook(b), 1);
    const span = Math.round((b - a) / DAY_MS);
    if (rows.length >= WUBOOK_PAGE_LIMIT && span > 0) {
      const mid = addDays(a, Math.floor(span / 2));
      await load(a, mid);
      await load(addDays(mid, 1), b);
      return;
    }
    if (rows.length >= WUBOOK_PAGE_LIMIT) {
      console.warn(`[adminStats] ${toWubook(a)}: ${rows.length} reservations, some may be missing`);
    }
    rows.forEach((r) => all.set(String(r.reservation_code), r));
  };
  for (let a = from; a <= to; a = addDays(a, 7)) {
    const b = addDays(a, 6) < to ? addDays(a, 6) : to;
    await load(a, b);
  }
  return [...all.values()];
};

const channelCatalogue = () => cached("channels", 24 * 60 * 60 * 1000, getChannelsInfo);

const buildChannels = async (days) => {
  const to = kyivToday();
  const from = addDays(to, -(days - 1));
  const [bookings, catalogue] = await Promise.all([
    fetchBookingsRange(from, to),
    channelCatalogue().catch(() => ({})),
  ]);

  const channelName = (id) =>
    id === 0 ? "Прямі (WuBook / сайт)" : catalogue[String(id)]?.name || `Канал #${id}`;

  const byChannel = new Map();
  const currencies = {};
  const totals = { bookings: 0, confirmed: 0, cancelled: 0, pending: 0, revenue: 0, nights: 0 };

  for (const b of bookings) {
    const status = Number(b.status);
    // A modification = cancelled original + new reservation; skip the original
    if (status === 5 && Number(b.was_modified) === 1) continue;

    const id = Number(b.id_channel) || 0;
    if (!byChannel.has(id)) {
      byChannel.set(id, {
        id,
        name: channelName(id),
        bookings: 0,
        confirmed: 0,
        cancelled: 0,
        pending: 0,
        revenue: 0,
        nights: 0,
        leadDaysSum: 0,
        leadCount: 0,
      });
    }
    const c = byChannel.get(id);
    c.bookings++;
    totals.bookings++;

    if (status === 1 || status === 4) {
      const amount = Number(b.amount) || 0;
      const arrival = parseWubookDate(b.date_arrival);
      const departure = parseWubookDate(b.date_departure);
      const nights = arrival && departure ? Math.max(0, Math.round((departure - arrival) / DAY_MS)) : 0;
      const received = parseReceived(b);

      c.confirmed++;
      c.revenue += amount;
      c.nights += nights;
      totals.confirmed++;
      totals.revenue += amount;
      totals.nights += nights;
      if (b.currency) currencies[b.currency] = (currencies[b.currency] || 0) + 1;
      if (arrival && received) {
        const lead = Math.round((arrival - received) / DAY_MS);
        if (lead >= 0 && lead < 730) {
          c.leadDaysSum += lead;
          c.leadCount++;
        }
      }
    } else if (status === 2) {
      c.pending++;
      totals.pending++;
    } else {
      c.cancelled++; // 3 refused, 5 cancelled, 6 cancelled with penalty
      totals.cancelled++;
    }
  }

  const channels = [...byChannel.values()]
    .map(({ leadDaysSum, leadCount, ...c }) => ({
      ...c,
      revenue: Math.round(c.revenue),
      adr: c.nights ? Math.round(c.revenue / c.nights) : null,
      cancelRate: c.bookings ? Math.round((c.cancelled / c.bookings) * 1000) / 10 : 0,
      avgLeadDays: leadCount ? Math.round(leadDaysSum / leadCount) : null,
    }))
    .sort((a, b) => b.revenue - a.revenue || b.bookings - a.bookings);

  const currency = Object.entries(currencies).sort((a, b) => b[1] - a[1])[0]?.[0] || "UAH";

  return {
    success: true,
    from: toIso(from),
    to: toIso(to),
    currency,
    totals: {
      ...totals,
      revenue: Math.round(totals.revenue),
      adr: totals.nights ? Math.round(totals.revenue / totals.nights) : null,
      cancelRate: totals.bookings ? Math.round((totals.cancelled / totals.bookings) * 1000) / 10 : 0,
    },
    channels,
  };
};

// Channel stats from Zak reservations (all channels: Booking.com, Airbnb, direct...)
const ZAK_CHANNEL_NAMES = { "--": "Прямі (телефон / сайт / офіс)" };

const buildChannelsZak = async (days) => {
  const to = kyivToday();
  const from = addDays(to, -(days - 1));
  const rows = await ZakReservation.find(
    { created: { $gte: from, $lt: addDays(to, 1) } },
    { status: 1, channel: 1, roomsTotal: 1, total: 1, currency: 1, created: 1, arrival: 1, rooms: 1 }
  ).lean();

  const byChannel = new Map();
  const currencies = {};
  const totals = { bookings: 0, confirmed: 0, cancelled: 0, pending: 0, revenue: 0, nights: 0 };

  for (const r of rows) {
    const key = r.channel || "--";
    if (!byChannel.has(key)) {
      byChannel.set(key, {
        id: key,
        name: ZAK_CHANNEL_NAMES[key] || key,
        bookings: 0,
        confirmed: 0,
        cancelled: 0,
        pending: 0,
        revenue: 0,
        nights: 0,
        leadDaysSum: 0,
        leadCount: 0,
      });
    }
    const c = byChannel.get(key);
    c.bookings++;
    totals.bookings++;
    const status = String(r.status || "").toLowerCase();
    if (status.startsWith("cancel")) {
      c.cancelled++;
      totals.cancelled++;
      continue;
    }
    if (status !== "confirmed") {
      c.pending++;
      totals.pending++;
      continue;
    }
    const amount = Number(r.roomsTotal || r.total) || 0;
    const nights = (r.rooms || []).reduce(
      (s, x) => s + (x.dfrom && x.dto ? Math.max(0, Math.round((x.dto - x.dfrom) / DAY_MS)) : 0),
      0
    );
    c.confirmed++;
    c.revenue += amount;
    c.nights += nights;
    totals.confirmed++;
    totals.revenue += amount;
    totals.nights += nights;
    if (r.currency) currencies[r.currency] = (currencies[r.currency] || 0) + 1;
    if (r.arrival && r.created) {
      const lead = Math.round((r.arrival - r.created) / DAY_MS);
      if (lead >= 0 && lead < 730) {
        c.leadDaysSum += lead;
        c.leadCount++;
      }
    }
  }

  const channels = [...byChannel.values()]
    .map(({ leadDaysSum, leadCount, ...c }) => ({
      ...c,
      revenue: Math.round(c.revenue),
      adr: c.nights ? Math.round(c.revenue / c.nights) : null,
      cancelRate: c.bookings ? Math.round((c.cancelled / c.bookings) * 1000) / 10 : 0,
      avgLeadDays: leadCount ? Math.round(leadDaysSum / leadCount) : null,
    }))
    .sort((a, b) => b.revenue - a.revenue || b.bookings - a.bookings);

  return {
    success: true,
    source: "zak",
    from: toIso(from),
    to: toIso(to),
    currency: Object.entries(currencies).sort((a, b) => b[1] - a[1])[0]?.[0] || "UAH",
    totals: {
      ...totals,
      revenue: Math.round(totals.revenue),
      adr: totals.nights ? Math.round(totals.revenue / totals.nights) : null,
      cancelRate: totals.bookings ? Math.round((totals.cancelled / totals.bookings) * 1000) / 10 : 0,
    },
    channels,
  };
};

// Zak data once the sync has covered the period, otherwise the WuBook channel-manager data
const zakBackfilled = async () => {
  try {
    const state = await zakSync.status();
    return Boolean(
      state.reservations &&
        state.backfilledThrough &&
        new Date(state.backfilledThrough) >= addDays(kyivToday(), -1)
    );
  } catch (_e) {
    return false;
  }
};

router.get("/channels", async (req, res) => {
  const days = clampInt(req.query.days, 1, 365, 30);
  try {
    const useZak = await zakBackfilled();
    res.json(
      await cached(`channels:${useZak ? "zak" : "wired"}:${days}`, 15 * 60 * 1000, () =>
        useZak ? buildChannelsZak(days) : buildChannels(days)
      )
    );
  } catch (err) {
    console.error("[adminStats] channels:", err.message);
    res.status(502).json({ success: false, error: "WuBook request failed" });
  }
});

// ---------- data for the forecasting engine (ml container) ----------

const isoDay = (d) => (d ? new Date(d).toISOString().slice(0, 10) : null);

// GET /adminStats/dataset?since=2023-01-01 — compact reservations + apartments, no guest data
router.get("/dataset", async (req, res) => {
  try {
    const since = /^\d{4}-\d{2}-\d{2}$/.test(String(req.query.since || "")) ? new Date(`${req.query.since}T00:00:00Z`) : new Date("2023-01-01T00:00:00Z");
    const [reservations, rooms, sync] = await Promise.all([
      ZakReservation.find(
        { departure: { $gte: since } },
        { status: 1, created: 1, lastStatusDate: 1, channel: 1, rooms: 1 }
      ).lean(),
      Rooms.find({}, { wubid: 1, name: 1, price: 1, category: 1 }).lean(),
      zakSync.status().catch(() => ({})),
    ]);
    res.json({
      success: true,
      generatedAt: new Date().toISOString(),
      sync: { backfilledThrough: isoDay(sync.backfilledThrough), lastRecentSync: sync.lastRecentSync || null },
      rooms: rooms
        .filter((r) => r.wubid)
        .map((r) => ({ roomType: Number(r.wubid), name: r.name, basePrice: r.price, category: r.category })),
      reservations: reservations.map((r) => ({
        id: r._id,
        status: r.status,
        created: isoDay(r.created),
        statusDate: isoDay(r.lastStatusDate),
        channel: r.channel,
        rooms: (r.rooms || []).map((x) => [x.roomType, isoDay(x.dfrom), isoDay(x.dto), Math.round(Number(x.total) || 0)]),
      })),
    });
  } catch (err) {
    console.error("[adminStats] dataset:", err.message);
    res.status(500).json({ success: false, error: "dataset failed" });
  }
});

// GET /adminStats/roomValues?days=60 — current WuBook price / availability per apartment and day
router.get("/roomValues", async (req, res) => {
  const days = clampInt(req.query.days, 1, 120, 60);
  try {
    const result = await cached(`roomValues:${days}`, 10 * 60 * 1000, async () => {
      const start = kyivToday();
      const [values, names] = await Promise.all([
        fetchRoomsValues(toWubook(start), toWubook(addDays(start, days - 1))),
        roomNames().catch(() => ({})),
      ]);
      const rooms = Object.entries(values || {}).map(([wdid, list]) => ({
        wdid,
        name: names[String(wdid).trim()] || null,
        days: (Array.isArray(list) ? list : []).slice(0, days).map((v, i) => ({
          date: toIso(addDays(start, i)),
          avail: Number(v && v.avail) || 0,
          closed: Number(v && v.closed) === 1,
          price: Number(v && v.price) || null,
          minStay: Number(v && v.min_stay) || 0,
        })),
      }));
      return { success: true, from: toIso(start), rooms };
    });
    res.json(result);
  } catch (err) {
    console.error("[adminStats] roomValues:", err.message);
    res.status(502).json({ success: false, error: "WuBook request failed" });
  }
});

router.get("/sync-status", async (_req, res) => {
  try {
    res.json({ success: true, ...(await zakSync.status()) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
