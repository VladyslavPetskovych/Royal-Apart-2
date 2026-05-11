const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
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

router.post("/bookings/import", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "file is required" });
    const result = await importBookingsFromFile(req.file.path);
    fs.unlink(req.file.path, () => {});
    return res.json({ success: true, ...result });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
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
    if (plan_id === undefined || !date_from || !date_to) {
      return res.status(400).json({
        success: false,
        error: "plan_id, date_from, date_to are required",
      });
    }

    const result = await syncRatePlanPrices({
      planId: Number(plan_id),
      dateFrom: date_from,
      dateTo: date_to,
      forceRefresh: Boolean(force_refresh),
    });

    return res.json({ success: true, ...result });
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
