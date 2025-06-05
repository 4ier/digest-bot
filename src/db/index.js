const mongoose = require('mongoose');
const config = require('../config');
const logger = require('../utils/logger');

mongoose.set('strictQuery', false);
const connections = new Map();

async function connect(tenantId = 'default') {
  if (connections.has(tenantId)) {
    return connections.get(tenantId);
  }
  const uri = config.mongodb.uri.replace(/\/$/, '') + `-${tenantId}`;
  const conn = await mongoose.createConnection(uri, {
    maxPoolSize: 10,
  });
  conn.on('error', (err) => logger.error('Mongo connection error:', err));
  connections.set(tenantId, conn);
  return conn;
}

async function disconnectAll() {
  await Promise.all(Array.from(connections.values()).map((c) => c.close()));
  connections.clear();
}

module.exports = {
  connect,
  disconnectAll,
};
