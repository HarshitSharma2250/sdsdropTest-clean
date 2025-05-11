// models/logsModel.js
const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    ip: String,
    method: String,
    url: String,
    device: String,
    time: { type: Date, default: Date.now },
    status: Number,
});

// Index to automatically delete documents older than 3 months
logSchema.index({ "createdAt": 1 }, { expireAfterSeconds: 7776000 }); 

const LogModel = mongoose.model('Log', logSchema);

module.exports = LogModel;