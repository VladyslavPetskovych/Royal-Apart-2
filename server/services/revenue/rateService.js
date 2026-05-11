const RatePlanPrice = require("../../models/ratePlanPrice");
const { fetchPlanPrices, fetchProducts } = require("./wubookClient");
const { parseFlexibleDate, rangeDatesISO } = require("./dateUtils");

function resolveToken(explicitToken) {
  return (
    explicitToken ||
    process.env.WUBOOK_TOKEN ||
    process.env.WUBOOK_XMLRPC_TOKEN ||
    process.env.WUBOOK_WR_TOKEN ||
    null
  );
}

function resolveLcode(explicitLcode) {
  const value =
    explicitLcode ||
    process.env.WUBOOK_LCODE ||
    process.env.WUBOOK_PROPERTY_LCODE ||
    null;
  return value === null ? null : Number(value);
}

async function syncRatePlanPrices({
  planId,
  dateFrom,
  dateTo,
  token,
  lcode,
  currency = process.env.WUBOOK_CURRENCY || "UAH",
  forceRefresh = false,
}) {
  const resolvedToken = resolveToken(token);
  const resolvedLcode = resolveLcode(lcode);
  const fromDate = parseFlexibleDate(dateFrom);
  const toDate = parseFlexibleDate(dateTo);
  if (!fromDate || !toDate) throw new Error("Invalid date range");
  if (!resolvedToken) {
    throw new Error(
      "Missing WUBOOK token. Set WUBOOK_TOKEN in server env or pass token in request body."
    );
  }
  if (resolvedLcode === null || Number.isNaN(resolvedLcode)) {
    throw new Error(
      "Missing WUBOOK lcode. Set WUBOOK_LCODE in server env or pass lcode in request body."
    );
  }

  const dateKeys = rangeDatesISO(fromDate, toDate);
  const query = {
    plan_id: Number(planId ?? 0),
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
    token: resolvedToken,
    lcode: resolvedLcode,
    planId: Number(planId ?? 0),
    dateFrom: fromDate,
    dateTo: toDate,
  });

  const ops = fetched.map((item) => ({
    updateOne: {
      filter: {
        date: parseFlexibleDate(item.date),
        plan_id: Number(planId ?? 0),
        room_code: item.room_code || "",
        room_type_code: item.room_type_code || "",
      },
      update: {
        $set: {
          date: parseFlexibleDate(item.date),
          room_code: item.room_code || "",
          room_type_code: item.room_type_code || "",
          plan_id: Number(planId ?? 0),
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
