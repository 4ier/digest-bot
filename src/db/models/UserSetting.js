const mongoose = require('mongoose');

const userSettingSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    tenantId: { type: String, required: true },
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

userSettingSchema.index({ userId: 1, tenantId: 1 }, { unique: true });

module.exports = (conn) => conn.model('UserSetting', userSettingSchema);
