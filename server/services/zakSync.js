// Keeps the zak_reservations collection in sync with Zak.
//  - backfill: all reservations created since ZAK_BACKFILL_FROM (resumable, runs once)
//  - every 2h: reservations created in the last 3 days
//  - daily:    reservations arriving in the next 180 days (catches cancellations / changes)
// Read-only towards Zak and throttled (see zakClient). Disable with ZAK_SYNC=off.
const cron = require("node-cron");
const mongoose = require("mongoose");
const ZakReservation = require("../models/zakReservation");
const { fetchReservations } = require("./zakClient");

const DAY_MS = 24 * 60 * 60 * 1000;
const BACKFILL_FROM = process.env.ZAK_BACKFILL_FROM || "2023-01-01";
const WINDOW_DAYS = 14;
const STATE_ID = "reservations";

const log = (...a) => console.log("[zakSync]", ...a);

// "dd/mm/yyyy[ hh:mm...]" -> UTC Date | null
const parseDate = (value) => {
  const m = String(value || "").match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  return m ? new Date(Date.UTC(+m[3], +m[2] - 1, +m[1])) : null;
};
const fmt = (d) =>
  `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`;
const todayUtc = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
};

const toDoc = (r) => {
  const rooms = r.rooms.map((room) => ({ ...room, dfrom: parseDate(room.dfrom), dto: parseDate(room.dto) }));
  const arrivals = rooms.map((x) => x.dfrom).filter(Boolean);
  const departures = rooms.map((x) => x.dto).filter(Boolean);
  return {
    _id: r.id,
    code: r.code,
    status: r.status,
    created: parseDate(r.created),
    lastStatusDate: parseDate(r.lastStatusDate),
    channel: r.channel,
    agency: r.agency,
    total: r.total,
    roomsTotal: r.roomsTotal,
    currency: r.currency,
    arrival: arrivals.length ? new Date(Math.min(...arrivals)) : null,
    departure: departures.length ? new Date(Math.max(...departures)) : null,
    rooms,
    syncedAt: new Date(),
  };
};

const upsert = async (list) => {
  if (!list.length) return;
  await ZakReservation.bulkWrite(
    list.map((r) => {
      const doc = toDoc(r);
      return { replaceOne: { filter: { _id: doc._id }, replacement: doc, upsert: true } };
    }),
    { ordered: false }
  );
};

const stateCollection = () => mongoose.connection.collection("zak_sync_state");
const getState = async () => (await stateCollection().findOne({ _id: STATE_ID })) || {};
const setState = (patch) => stateCollection().updateOne({ _id: STATE_ID }, { $set: patch }, { upsert: true });

const backfill = async () => {
  const state = await getState();
  let from = state.backfilledThrough
    ? new Date(new Date(state.backfilledThrough).getTime() + DAY_MS)
    : new Date(`${BACKFILL_FROM}T00:00:00Z`);
  const end = todayUtc();
  if (from > end) return;
  log(`backfill from ${fmt(from)}`);
  let total = 0;
  while (from <= end) {
    const to = new Date(Math.min(from.getTime() + (WINDOW_DAYS - 1) * DAY_MS, end.getTime()));
    total += await fetchReservations({ created: { from: fmt(from), to: fmt(to) } }, upsert);
    await setState({ backfilledThrough: to, updatedAt: new Date() });
    from = new Date(to.getTime() + DAY_MS);
  }
  log(`backfill done: ${total} reservations`);
};

const syncRecent = async () => {
  const end = todayUtc();
  const n = await fetchReservations(
    { created: { from: fmt(new Date(end.getTime() - 3 * DAY_MS)), to: fmt(end) } },
    upsert
  );
  await setState({ lastRecentSync: new Date() });
  log(`recent: ${n}`);
};

const syncUpcoming = async () => {
  const today = todayUtc();
  const n = await fetchReservations(
    {
      arrival: {
        from: fmt(new Date(today.getTime() - 2 * DAY_MS)),
        to: fmt(new Date(today.getTime() + 180 * DAY_MS)),
      },
    },
    upsert
  );
  await setState({ lastUpcomingSync: new Date() });
  log(`upcoming: ${n}`);
};

// Run jobs one at a time; a failure is logged and never crashes the server
let queue = Promise.resolve();
const enqueue = (name, job) => {
  queue = queue.then(job).catch((err) => log(`${name} failed:`, err.message));
  return queue;
};

const whenConnected = () =>
  mongoose.connection.readyState === 1
    ? Promise.resolve()
    : new Promise((resolve) => mongoose.connection.once("connected", resolve));

const start = () => {
  if (process.env.ZAK_SYNC === "off") return log("disabled (ZAK_SYNC=off)");
  if (!process.env.WUDOO_API_KEY) return log("disabled: WUDOO_API_KEY is not set");

  whenConnected().then(() => {
    enqueue("backfill", backfill);
    enqueue("upcoming", syncUpcoming);
    enqueue("recent", syncRecent);
  });
  cron.schedule("15 */2 * * *", () => enqueue("recent", syncRecent));
  cron.schedule("30 3 * * *", () => enqueue("upcoming", syncUpcoming));
};

const status = async () => {
  const [state, count, latest] = await Promise.all([
    getState(),
    ZakReservation.estimatedDocumentCount(),
    ZakReservation.findOne({}, { created: 1 }).sort({ created: -1 }).lean(),
  ]);
  return { ...state, reservations: count, latestCreated: latest ? latest.created : null };
};

module.exports = { start, status, toDoc, parseDate };
