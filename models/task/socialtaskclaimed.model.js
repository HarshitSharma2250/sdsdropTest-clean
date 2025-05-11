const mongoose = require("mongoose");

const userTaskClaimSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Task",
    required: true,
  },
  claimed: {
    type: Boolean,
    default: false, 
  },
  claimedAt: {
    type: Date,
    default: Date.now,
  },
},{
  timestamps:true,
  versionKey:false
});

userTaskClaimSchema.index({ user: 1, task: 1 }, { unique: true });

module.exports = mongoose.model("UserTaskClaim", userTaskClaimSchema);
