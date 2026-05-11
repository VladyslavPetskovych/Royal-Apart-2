const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const mongoose = require("../db");
const Booking = require("../models/booking");
const RatePlanPrice = require("../models/ratePlanPrice");
const {
  importBookingsFromFile,
} = require("../services/revenue/bookingImporter");
const {
  syncRatePlanPrices,
  fetchProducts,
} = require("../services/revenue/rateService");
const {
  getComparisons,
  aggregateAnalytics,
  buildMLDataset,
  trainBaselineModel,
  saveBaselineModel,
} = require("../services/revenue/analyticsService");

const router = express.Router();

const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({ dest: uploadDir });

async function detectBookingRange(sourceFile = null) {
  const matchStage = sourceFile ? { source_file: sourceFile } : {};
  const stats = await Booking.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        minFrom: { $min: "$from_date" },
        maxTo: { $max: "$to_date" },
      },
    },
  ]);
  const row = stats[0];
  if (!row?.minFrom || !row?.maxTo) return null;
  return {
    from: row.minFrom,
    to: row.maxTo,
  };
}

async function detectWuBookCredentials() {
  const token =
    process.env.WUBOOK_TOKEN ||
    process.env.WUBOOK_XMLRPC_TOKEN ||
    process.env.WUBOOK_WR_TOKEN ||
    "wr_9fd536d9-2894-441a-85eb-4b1a670e2ff2";

  let lcode =
    process.env.WUBOOK_LCODE ||
    process.env.WUBOOK_PROPERTY_LCODE ||
    null;

  if (!lcode) {
    try {
      const db = mongoose.connection.useDb("apartments");
      const room = await db.collection("wodoo_aparts").findOne(
        { lcode: { $exists: true } },
        { projection: { lcode: 1 } }
      );
      if (room?.lcode !== undefined && room?.lcode !== null) {
        lcode = room.lcode;
      }
    } catch (_e) {
      // noop
    }
  }

  if (!lcode) lcode = 1638349860;

  return {
    token,
    lcode: Number(lcode),
  };
}

router.post("/bookings/import", upload.single("file"), async (req, res) => {
  let tempPath = null;
  try {
    if (!req.file) return res.status(400).json({ error: "file is required" });
    tempPath = req.file.path;
    const result = await importBookingsFromFile(
      req.file.path,
      req.file.originalname
    );
    const payload = { success: true, ...result };

    const autoSync = req.body?.auto_sync_rates === "true" || req.body?.auto_sync_rates === true;
    if (autoSync && result.imported > 0) {
      const sourceName = path.basename(req.file.originalname);
      const range = await detectBookingRange(sourceName);
      if (range) {
        try {
          const creds = await detectWuBookCredentials();
          const syncResult = await syncRatePlanPrices({
            planId: Number(req.body?.plan_id ?? 0),
            dateFrom: range.from,
            dateTo: range.to,
            token: creds.token,
            lcode: creds.lcode,
            forceRefresh: req.body?.force_refresh === "true" || req.body?.force_refresh === true,
          });
          payload.auto_sync = {
            success: true,
            used_range: {
              from: range.from.toISOString().slice(0, 10),
              to: range.to.toISOString().slice(0, 10),
            },
            ...syncResult,
          };
        } catch (syncError) {
          payload.auto_sync = {
            success: false,
            error: syncError.message,
          };
        }
      }
    }

    return res.json(payload);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  } finally {
    if (tempPath) fs.unlink(tempPath, () => {});
  }
});

router.get("/wubook/products", async (req, res) => {
  try {
    const data = await fetchProducts();
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/rates/sync", async (req, res) => {
  try {
    const { plan_id, date_from, date_to, force_refresh } = req.body;

    let rangeFrom = date_from;
    let rangeTo = date_to;
    let autoDetectedRange = null;
    if (!rangeFrom || !rangeTo) {
      const range = await detectBookingRange();
      if (!range) {
        return res.status(400).json({
          success: false,
          error: "No booking date range found. Upload bookings first or pass date_from/date_to.",
        });
      }
      rangeFrom = range.from;
      rangeTo = range.to;
      autoDetectedRange = {
        from: range.from.toISOString().slice(0, 10),
        to: range.to.toISOString().slice(0, 10),
      };
    }

    const creds = await detectWuBookCredentials();
    const result = await syncRatePlanPrices({
      planId: Number(plan_id ?? 0),
      dateFrom: rangeFrom,
      dateTo: rangeTo,
      token: creds.token,
      lcode: creds.lcode,
      forceRefresh: Boolean(force_refresh),
    });

    return res.json({
      success: true,
      used_range: autoDetectedRange || {
        from: new Date(rangeFrom).toISOString().slice(0, 10),
        to: new Date(rangeTo).toISOString().slice(0, 10),
      },
      ...result,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/comparison", async (req, res) => {
  try {
    const { from, to, room_code, room_type_code } = req.query;
    if (!from || !to) return res.status(400).json({ error: "from and to are required" });

    const comparisons = await getComparisons({
      from,
      to,
      roomCode: room_code,
      roomTypeCode: room_type_code,
    });
    return res.json({ success: true, rows: comparisons.length, comparisons });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/comparison/export", async (req, res) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) return res.status(400).json({ error: "from and to are required" });
    const comparisons = await getComparisons({ from, to });
    const headers = [
      "booking_code",
      "stay_date",
      "room_code",
      "room_type_code",
      "actual_daily_price",
      "tariff_price",
      "diff_amount",
      "diff_percent",
      "is_above_tariff",
      "is_below_tariff",
    ];
    const rows = [
      headers.join(","),
      ...comparisons.map((item) =>
        headers.map((h) => JSON.stringify(item[h] ?? "")).join(",")
      ),
    ];
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=price-comparison.csv");
    return res.send(rows.join("\n"));
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/analytics/summary", async (req, res) => {
  try {
    const { from, to, capacity } = req.query;
    if (!from || !to) return res.status(400).json({ error: "from and to are required" });
    const comparisons = await getComparisons({ from, to });
    const analytics = aggregateAnalytics(comparisons, {
      capacity: capacity ? Number(capacity) : null,
    });
    return res.json({ success: true, analytics });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/ml/dataset", async (req, res) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) return res.status(400).json({ error: "from and to are required" });
    const comparisons = await getComparisons({ from, to });
    const bookings = await Booking.find({
      from_date: { $lte: new Date(to) },
      to_date: { $gte: new Date(from) },
    }).lean();
    const dataset = buildMLDataset(comparisons, bookings);
    return res.json({ success: true, rows: dataset.length, dataset });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/ml/train-baseline", async (req, res) => {
  try {
    const { from, to } = req.body;
    if (!from || !to) return res.status(400).json({ error: "from and to are required" });
    const comparisons = await getComparisons({ from, to });
    const bookings = await Booking.find({
      from_date: { $lte: new Date(to) },
      to_date: { $gte: new Date(from) },
    }).lean();
    const dataset = buildMLDataset(comparisons, bookings);
    const trained = trainBaselineModel(dataset);
    const savedAt = saveBaselineModel({
      generated_at: new Date().toISOString(),
      metrics: trained.metrics,
      model: trained.model,
    });

    return res.json({
      success: true,
      metrics: trained.metrics,
      model_path: savedAt,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/ml/predict", async (req, res) => {
  try {
    const payload = req.body || {};
    const modelPath = path.join(
      __dirname,
      "..",
      "data2025",
      "models",
      "revenue-baseline-model.json"
    );
    if (!fs.existsSync(modelPath)) {
      return res.status(404).json({ error: "Baseline model is not trained yet" });
    }
    const modelJson = JSON.parse(fs.readFileSync(modelPath, "utf8"));
    const date = new Date(payload.stay_date);
    const month = date.getMonth() + 1;
    const dayOfWeek = date.getDay();
    const key = `${payload.room_type_code || ""}|${dayOfWeek}|${month}`;
    const baseline = modelJson.model[key] || Number(payload.tariff_price || 0);
    let recommended = baseline;
    if (Number(payload.booking_window_days || 0) <= 3) recommended *= 1.08;
    if (Number(payload.booking_window_days || 0) >= 30) recommended *= 0.95;
    if (Number(payload.occupancy_for_date || 0) >= 80) recommended *= 1.07;
    if (Number(payload.occupancy_for_date || 0) <= 30) recommended *= 0.92;

    const tariff = Number(payload.tariff_price || 0);
    return res.json({
      success: true,
      recommended_price: Number(recommended.toFixed(2)),
      tariff_price: tariff,
      delta_vs_tariff: Number((recommended - tariff).toFixed(2)),
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/health", async (_req, res) => {
  const [bookings, rates] = await Promise.all([
    Booking.countDocuments({}),
    RatePlanPrice.countDocuments({}),
  ]);
  return res.json({
    success: true,
    bookings,
    rates,
  });
});

module.exports = router;
