const mongoose = require('mongoose');

const userSettingSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    tenantId: { type: String, required: true },
    digestTime: { type: String, default: '20:00' },
    enabledChats: [String],
  },
  { timestamps: true }
);

module.exports = (conn) => conn.model('UserSetting', userSettingSchema);
