const mongoose = require("mongoose");

const apiHitSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  // hit_time: {
  //   type: Date,
  //   required: true, 
  // },
  multiPoints: {
    type: Number,
    enum: [1, 5, 10, 15],
    required: true,
  },
  telegramStar: {
    type: String,
    required: false,
    default: "",
  },
}, {
  timestamps: true,
  versionKey: false,
});

module.exports = mongoose.model("ApiHit", apiHitSchema);
