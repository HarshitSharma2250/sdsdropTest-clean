const mongoose = require("mongoose");

const AdWatchLimitSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  card: { type: mongoose.Schema.Types.ObjectId,ref: 'Card',require:true},
  createdAt: { type: Date, default: Date.now, expires: 3600 } 
}, {
  versionKey: false,
  timestamps:true
});

module.exports = mongoose.model("AdWatchLimit", AdWatchLimitSchema);
