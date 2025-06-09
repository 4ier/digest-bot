const mongoose = require('mongoose');

const dailyDigestSchema = new mongoose.Schema(
  {
    content: { type: String, required: true },
    date: { type: Date, required: true },
    tenantId: { type: String, required: true },
    version: { type: String, default: 'v1' },
  },
  { timestamps: true }
);

module.exports = (conn) => conn.model('DailyDigest', dailyDigestSchema);
