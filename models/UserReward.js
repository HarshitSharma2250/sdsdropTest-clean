const mongoose = require("mongoose");

const RewardSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  points: { type: Number, default: 0 },
  rewardType: { type: String, enum: ["cashback", "discount", "bonus"], required: true },
  status: { type: String, enum: ["active", "redeemed", "expired"], default: "active" },
  watched_ads: { type: Number, default: 0 },
  completed_tasks: { type: Number, default: 0 },
  tsads: { type: Number, default: 0 },
  weeklyTsadsPoints: { type: Number, default: 0 },
  monthlyTsadsPoints: { type: Number, default: 0 },
  refered_count: { type: Number, default: 0 },
  refered_points: { type: Number, default: 0 }
}, {
  timestamps: true,
  versionKey: false
});

module.exports = mongoose.model("Reward", RewardSchema);
