const db = require('../db');
const createModel = require('../db/models/UserSetting');

async function getModel(tenantId) {
  const conn = await db.connect(tenantId);
  if (!conn.models.UserSetting) {
    createModel(conn);
  }
  return conn.model('UserSetting');
}

async function getSettings(tenantId, userId) {
  const Model = await getModel(tenantId);
  let setting = await Model.findOne({ tenantId, userId });
  if (!setting) {
    setting = await Model.create({ tenantId, userId });
  }
  return setting;
}

async function updateSettings(tenantId, userId, updates) {
  const Model = await getModel(tenantId);
  const setting = await Model.findOneAndUpdate(
    { tenantId, userId },
    updates,
    { new: true, upsert: true }
  );
  return setting;
}

module.exports = {
  getSettings,
  updateSettings,
};
