const mongoose = require('mongoose');

const BoostSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isBoosted: { type: Boolean, default: false },
  boostTime: { type: Date },
}, {
  timestamps: true,
  versionKey: false,
});

module.exports = mongoose.model('Boost', BoostSchema);
