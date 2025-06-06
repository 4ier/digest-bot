const mongoose = require('mongoose');

const tenantSettingSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, unique: true },
    digestTime: { type: String, default: '20:00' },
    enabledChats: [String],
    summaryStyle: {
      type: String,
      enum: ['bullet', 'paragraph'],
      default: 'bullet',
    },
  },
  { timestamps: true }
);

module.exports = (conn) => conn.model('TenantSetting', tenantSettingSchema);
