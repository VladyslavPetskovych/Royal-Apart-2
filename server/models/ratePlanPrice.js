const mongoose = require("mongoose");

const ratePlanPriceSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true, index: true },
    room_type_code: { type: String, index: true },
    room_code: { type: String, index: true },
    plan_id: { type: Number, required: true, index: true },
    tariff_price: { type: Number, required: true },
    currency: { type: String, default: "UAH" },
    source: { type: String, default: "wubook" },
    fetched_at: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

ratePlanPriceSchema.index(
  { date: 1, plan_id: 1, room_type_code: 1, room_code: 1 },
  { unique: true }
);

module.exports = mongoose.model("rate_plan_prices", ratePlanPriceSchema);
