const RatePlanPrice = require("../../models/ratePlanPrice");
const { fetchPlanPrices, fetchProducts } = require("./wubookClient");
const { parseFlexibleDate, rangeDatesISO } = require("./dateUtils");

async function syncRatePlanPrices({
  planId,
  dateFrom,
  dateTo,
  token = process.env.WUBOOK_TOKEN,
  lcode = process.env.WUBOOK_LCODE,
  currency = process.env.WUBOOK_CURRENCY || "UAH",
  forceRefresh = false,
}) {
  const fromDate = parseFlexibleDate(dateFrom);
  const toDate = parseFlexibleDate(dateTo);
  if (!fromDate || !toDate) throw new Error("Invalid date range");

  const dateKeys = rangeDatesISO(fromDate, toDate);
  const query = {
    plan_id: Number(planId),
    date: { $gte: fromDate, $lte: toDate },
  };
  const existing = forceRefresh ? [] : await RatePlanPrice.find(query).lean();
  const existingDates = new Set(existing.map((item) => item.date.toISOString().slice(0, 10)));
  const missingDates = dateKeys.filter((date) => !existingDates.has(date));

  if (!missingDates.length) {
    return {
      fromCache: true,
      saved: 0,
      cachedCount: existing.length,
    };
  }

  const fetched = await fetchPlanPrices({
    token,
    lcode,
    planId,
    dateFrom: fromDate,
    dateTo: toDate,
  });

  const ops = fetched.map((item) => ({
    updateOne: {
      filter: {
        date: parseFlexibleDate(item.date),
        plan_id: Number(planId),
        room_code: item.room_code || "",
        room_type_code: item.room_type_code || "",
      },
      update: {
        $set: {
          date: parseFlexibleDate(item.date),
          room_code: item.room_code || "",
          room_type_code: item.room_type_code || "",
          plan_id: Number(planId),
          tariff_price: Number(item.tariff_price),
          currency,
          fetched_at: new Date(),
        },
      },
      upsert: true,
    },
  }));

  if (ops.length) await RatePlanPrice.bulkWrite(ops, { ordered: false });
  return {
    fromCache: false,
    fetchedCount: fetched.length,
    saved: ops.length,
  };
}

module.exports = {
  syncRatePlanPrices,
  fetchProducts,
};
