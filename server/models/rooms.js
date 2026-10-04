const mongoose = require("mongoose");

const roomSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    numrooms: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    wubid: { type: Number },
    wdid: { type: String },
    imgurl: [],
    globalId: {
      type: Number,
    },
    floor: {
      type: Number,
    },
    beds: {
      type: Number,
    },
    surface: {
      type: Number,
    },
    guests: {
      type: Number,
    },
    currentbookings: [],
    // display order on the site / admin panel (lower = first)
    sortOrder: {
      type: Number,
    },
    additionalProperties: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
  },
  { timestamps: true }
);

const rmModel = mongoose.model("aparts", roomSchema);
module.exports = rmModel;








