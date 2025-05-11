const mongoose = require('mongoose');

const MiningSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  points: { type: Number, default: 0 },
  isBoosted: { type: Boolean, default: false },
  boostStartTime: { type: Date },
  lastUpdated: { type: Date, default: Date.now },
}, {
  timestamps: true,
  versionKey: false,
});

module.exports = mongoose.model('Mining', MiningSchema);
