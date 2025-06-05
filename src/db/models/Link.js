const mongoose = require('mongoose');

const linkSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    platform: { type: String, default: 'unknown' },
    category: { type: String, enum: ['work', 'other'], default: 'other' },
    title: String,
    summary: String,
    tenantId: { type: String, required: true },
    userId: String,
  },
  { timestamps: true }
);

module.exports = (conn) => conn.model('Link', linkSchema);
