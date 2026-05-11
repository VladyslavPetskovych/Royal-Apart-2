const fs = require("fs");
const path = require("path");
const Booking = require("../../models/booking");
const RatePlanPrice = require("../../models/ratePlanPrice");
const { parseFlexibleDate, toISODate } = require("./dateUtils");

function seasonByMonth(month) {
  if ([12, 1, 2].includes(month)) return "winter";
  if ([3, 4, 5].includes(month)) return "spring";
  if ([6, 7, 8].includes(month)) return "summer";
  return "autumn";
}

function buildStayDates(fromDate, toDate) {
  const items = [];
  const cursor = new Date(fromDate);
  const finish = new Date(toDate);
  while (cursor < finish) {
    items.push(toISODate(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return items;
}

function calculateDiff(actualDailyPrice, tariffPrice) {
  const diffAmount = Number((actualDailyPrice - tariffPrice).toFixed(2));
  const diffPercent = tariffPrice
    ? Number(((diffAmount / tariffPrice) * 100).toFixed(2))
    : 0;
  return {
    diff_amount: diffAmount,
    diff_percent: diffPercent,
    is_above_tariff: diffAmount > 0,
    is_below_tariff: diffAmount < 0,
  };
}

async function getComparisons({ from, to, roomCode, roomTypeCode, statuses = ["Confirmed"] }) {
  const fromDate = parseFlexibleDate(from);
  const toDate = parseFlexibleDate(to);
  if (!fromDate || !toDate) throw new Error("Invalid date range");

  const bookingQuery = {
    from_date: { $lte: toDate },
    to_date: { $gte: fromDate },
    row_type: { $in: ["ROOM", "TOTAL"] },
  };

  if (statuses?.length) bookingQuery.status = { $in: statuses };
  if (roomCode) bookingQuery.room_code = roomCode;
  if (roomTypeCode) bookingQuery.room_type_code = roomTypeCode;

  const [bookings, rates] = await Promise.all([
    Booking.find(bookingQuery).lean(),
    RatePlanPrice.find({
      date: { $gte: fromDate, $lte: toDate },
      ...(roomCode ? { room_code: roomCode } : {}),
      ...(roomTypeCode ? { room_type_code: roomTypeCode } : {}),
    }).lean(),
  ]);

  const rateMap = new Map();
  for (const rate of rates) {
    const dateKey = toISODate(rate.date);
    if (!dateKey) continue;
    const keyByRoom = `${dateKey}|${rate.room_code || ""}`;
    const keyByType = `${dateKey}|${rate.room_type_code || ""}`;
    if (rate.room_code) rateMap.set(keyByRoom, rate);
    if (rate.room_type_code) rateMap.set(keyByType, rate);
  }

  const comparisons = [];
  for (const booking of bookings) {
    if (!booking.from_date || !booking.to_date) continue;
    const stayDates = buildStayDates(booking.from_date, booking.to_date);
    const actualDailyPrice =
      booking.room_daily_price > 0
        ? booking.room_daily_price
        : booking.nights > 0
        ? booking.total_price / booking.nights
        : 0;

    for (const stayDate of stayDates) {
      const byRoom = rateMap.get(`${stayDate}|${booking.room_code || ""}`);
      const byType = rateMap.get(`${stayDate}|${booking.room_type_code || ""}`);
      const rate = byRoom || byType;
      if (!rate || !Number.isFinite(actualDailyPrice) || actualDailyPrice <= 0) continue;
      comparisons.push({
        booking_code: booking.code,
        stay_date: stayDate,
        room_code: booking.room_code,
        room_type_code: booking.room_type_code,
        actual_daily_price: Number(actualDailyPrice.toFixed(2)),
        tariff_price: Number(rate.tariff_price),
        ...calculateDiff(actualDailyPrice, Number(rate.tariff_price)),
      });
    }
  }

  return comparisons;
}

function aggregateAnalytics(comparisons, { capacity = null } = {}) {
  if (!comparisons.length) {
    return {
      adr: 0,
      revpar: 0,
      occupancy: [],
      pickup: [],
      pace: [],
      avg_price_by_room_type: [],
      seasonality: [],
    };
  }

  const adr =
    comparisons.reduce((sum, c) => sum + c.actual_daily_price, 0) / comparisons.length;

  const byDate = new Map();
  const byType = new Map();
  const seasonality = new Map();

  for (const item of comparisons) {
    const dateKey = item.stay_date;
    if (!byDate.has(dateKey)) byDate.set(dateKey, []);
    byDate.get(dateKey).push(item);

    const typeKey = item.room_type_code || "UNKNOWN";
    if (!byType.has(typeKey)) byType.set(typeKey, []);
    byType.get(typeKey).push(item.actual_daily_price);

    const d = new Date(`${item.stay_date}T00:00:00Z`);
    const month = d.getUTCMonth() + 1;
    const dayOfWeek = d.getUTCDay();
    const seasonKey = `${month}|${dayOfWeek}`;
    if (!seasonality.has(seasonKey)) seasonality.set(seasonKey, []);
    seasonality.get(seasonKey).push(item.actual_daily_price);
  }

  const occupancy = [...byDate.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, items]) => ({
      date,
      sold_rooms: new Set(items.map((i) => i.room_code)).size,
      occupancy_rate:
        capacity && capacity > 0
          ? Number(((new Set(items.map((i) => i.room_code)).size / capacity) * 100).toFixed(2))
          : null,
    }));

  const revpar =
    capacity && capacity > 0
      ? Number(
          (
            occupancy.reduce((sum, d) => sum + (d.occupancy_rate || 0), 0) /
            occupancy.length /
            100 *
            adr
          ).toFixed(2)
        )
      : null;

  const avg_price_by_room_type = [...byType.entries()].map(([room_type_code, prices]) => ({
    room_type_code,
    avg_price: Number((prices.reduce((s, p) => s + p, 0) / prices.length).toFixed(2)),
  }));

  const pickup = occupancy.map((item, idx) => ({
    date: item.date,
    pickup_rooms:
      idx === 0 ? item.sold_rooms : Math.max(0, item.sold_rooms - occupancy[idx - 1].sold_rooms),
  }));

  const pace = occupancy.map((item) => ({
    date: item.date,
    pace: item.sold_rooms,
  }));

  const seasonalityRows = [...seasonality.entries()].map(([key, prices]) => {
    const [monthRaw, dowRaw] = key.split("|");
    const month = Number(monthRaw);
    const day_of_week = Number(dowRaw);
    return {
      month,
      season: seasonByMonth(month),
      day_of_week,
      avg_price: Number((prices.reduce((s, p) => s + p, 0) / prices.length).toFixed(2)),
    };
  });

  return {
    adr: Number(adr.toFixed(2)),
    revpar,
    occupancy,
    pickup,
    pace,
    avg_price_by_room_type,
    seasonality: seasonalityRows,
  };
}

function buildMLDataset(comparisons, bookings) {
  const bookingMap = new Map(bookings.map((b) => [b.code, b]));
  return comparisons.map((item) => {
    const booking = bookingMap.get(item.booking_code) || {};
    const stay = new Date(`${item.stay_date}T00:00:00Z`);
    const month = stay.getUTCMonth() + 1;
    const dayOfWeek = stay.getUTCDay();
    const createdAt = booking.created_at ? new Date(booking.created_at) : null;
    const bookingWindowDays =
      createdAt && booking.from_date
        ? Math.max(
            0,
            Math.floor(
              (new Date(booking.from_date).getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
            )
          )
        : 0;

    return {
      stay_date: item.stay_date,
      day_of_week: dayOfWeek,
      month,
      season: seasonByMonth(month),
      is_weekend: dayOfWeek === 0 || dayOfWeek === 6 ? 1 : 0,
      booking_window_days: bookingWindowDays,
      nights: booking.nights || 0,
      adults: booking.adults || 0,
      children: booking.children || 0,
      room_type_code: item.room_type_code || "",
      room_code: item.room_code || "",
      tariff_price: item.tariff_price,
      historical_actual_price: item.actual_daily_price,
      target_actual_price: item.actual_daily_price,
    };
  });
}

function trainBaselineModel(dataset) {
  if (!dataset.length) throw new Error("Empty dataset");

  const splitIndex = Math.max(1, Math.floor(dataset.length * 0.8));
  const train = dataset.slice(0, splitIndex);
  const test = dataset.slice(splitIndex);

  const grouped = new Map();
  train.forEach((row) => {
    const key = `${row.room_type_code}|${row.day_of_week}|${row.month}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(row.target_actual_price);
  });

  const model = {};
  for (const [key, values] of grouped.entries()) {
    model[key] = values.reduce((a, b) => a + b, 0) / values.length;
  }

  function predict(row) {
    const key = `${row.room_type_code}|${row.day_of_week}|${row.month}`;
    const base = model[key] || row.tariff_price;
    let adjusted = base;
    if (row.booking_window_days <= 3) adjusted *= 1.08;
    if (row.booking_window_days >= 30) adjusted *= 0.95;
    return Number(adjusted.toFixed(2));
  }

  const evalRows = (test.length ? test : train).map((row) => {
    const predicted = predict(row);
    const actual = row.target_actual_price;
    const err = predicted - actual;
    return {
      abs: Math.abs(err),
      sq: err * err,
      ape: actual ? Math.abs(err / actual) : 0,
    };
  });

  const mae = evalRows.reduce((s, r) => s + r.abs, 0) / evalRows.length;
  const rmse = Math.sqrt(evalRows.reduce((s, r) => s + r.sq, 0) / evalRows.length);
  const mape = (evalRows.reduce((s, r) => s + r.ape, 0) / evalRows.length) * 100;

  return {
    model,
    metrics: {
      mae: Number(mae.toFixed(2)),
      rmse: Number(rmse.toFixed(2)),
      mape: Number(mape.toFixed(2)),
      train_size: train.length,
      test_size: test.length,
    },
    predict,
  };
}

function saveBaselineModel(modelObject) {
  const outDir = path.join(__dirname, "..", "..", "data2025", "models");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const filePath = path.join(outDir, "revenue-baseline-model.json");
  fs.writeFileSync(filePath, JSON.stringify(modelObject, null, 2), "utf8");
  return filePath;
}

module.exports = {
  calculateDiff,
  getComparisons,
  aggregateAnalytics,
  buildMLDataset,
  trainBaselineModel,
  saveBaselineModel,
};
