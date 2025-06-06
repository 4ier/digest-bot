const db = require('../db');
const createModel = require('../db/models/TenantSetting');

async function getModel(tenantId) {
  const conn = await db.connect(tenantId);
  if (!conn.models.TenantSetting) {
    createModel(conn);
  }
  return conn.model('TenantSetting');
}

async function getSettings(tenantId) {
  const Model = await getModel(tenantId);
  let setting = await Model.findOne({ tenantId });
  if (!setting) {
    setting = await Model.create({ tenantId });
  }
  return setting;
}

async function updateSettings(tenantId, updates) {
  const Model = await getModel(tenantId);
  const setting = await Model.findOneAndUpdate(
    { tenantId },
    updates,
    { new: true, upsert: true }
  );
  return setting;
}

module.exports = {
  getSettings,
  updateSettings,
};
