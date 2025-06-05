const mongoose = require('mongoose');

const tenantSettingSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, unique: true },
    digestTime: { type: String, default: '20:00' },
  },
  { timestamps: true }
);

module.exports = (conn) => conn.model('TenantSetting', tenantSettingSchema);
