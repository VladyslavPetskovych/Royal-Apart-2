const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    code: { type: String, index: true },
    wubook_id: { type: String, index: true },
    status: { type: String, index: true },
    created_at: { type: Date, index: true },
    cancelled_at: { type: Date },
    from_date: { type: Date, index: true },
    to_date: { type: Date, index: true },
    nights: { type: Number, default: 0 },
    room_code: { type: String, index: true },
    room_name: { type: String },
    room_type_code: { type: String, index: true },
    room_type_name: { type: String },
    row_type: { type: String, index: true },
    total_price: { type: Number, default: 0 },
    room_daily_price: { type: Number, default: 0 },
    adults: { type: Number, default: 0 },
    teens: { type: Number, default: 0 },
    children: { type: Number, default: 0 },
    board: { type: String },
    policy: { type: String },
    agency: { type: String },
    country: { type: String },
    source_file: { type: String },
    raw: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

bookingSchema.index(
  { code: 1, from_date: 1, to_date: 1, room_code: 1, row_type: 1 },
  { unique: true, sparse: true }
);

module.exports = mongoose.model("bookings", bookingSchema);
