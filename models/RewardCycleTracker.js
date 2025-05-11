const mongoose = require("mongoose");

const rewardCycleTrackerSchema = new mongoose.Schema({
  apiHitId: { type: mongoose.Schema.Types.ObjectId, ref: "ApiHit", required: true },
  hoursRewarded: { type: Number, default: 0 },
  active: { type: Boolean, default: true }
}, {
  timestamps: true,
  versionKey: false
});

module.exports = mongoose.model("RewardCycleTracker", rewardCycleTrackerSchema);
