// Reservations synced from Zak (WuBook PMS) for analytics and forecasting.
// Only operational fields — no guest names, contacts or customer ids.
const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    roomType: Number, // Zak room type id (= aparts.wubid)
    room: Number,
    dfrom: Date, // first night
    dto: Date, // departure day
    total: Number,
    adults: Number,
    children: Number,
  },
  { _id: false }
);

const zakReservationSchema = new mongoose.Schema(
  {
    _id: Number, // Zak reservation id
    code: String,
    status: { type: String, index: true },
    created: { type: Date, index: true },
    lastStatusDate: Date,
    channel: { type: String, index: true },
    agency: String,
    total: Number,
    roomsTotal: Number,
    currency: String,
    arrival: { type: Date, index: true },
    departure: { type: Date, index: true },
    rooms: [roomSchema],
    syncedAt: Date,
  },
  { versionKey: false }
);

module.exports = mongoose.model("zak_reservations", zakReservationSchema, "zak_reservations");
