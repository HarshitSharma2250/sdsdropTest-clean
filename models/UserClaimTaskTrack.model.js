const mongoose = require("mongoose");

const taskClaimSchema = new mongoose.Schema({
  task_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Task",
    required: true,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  claimed_at: {
    type: Date,
    default: Date.now,
  },
  claimed:{
    type:Boolean,
    default:false
  }
}, {
  timestamps: true,
  versionKey: false
});
taskClaimSchema.index({ claimed_at: 1, claimed: 1 });
module.exports = mongoose.model("TaskClaim", taskClaimSchema);
