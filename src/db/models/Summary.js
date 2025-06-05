const mongoose = require('mongoose');

const summarySchema = new mongoose.Schema(
  {
    linkId: { type: mongoose.Schema.Types.ObjectId, ref: 'Link', required: true },
    content: { type: String, required: true },
    style: { type: String, enum: ['bullet', 'paragraph'], default: 'bullet' },
    tenantId: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = (conn) => conn.model('Summary', summarySchema);
