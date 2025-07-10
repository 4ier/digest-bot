// MongoDB initialization script
const db = db.getSiblingDB('feishu-digest-bot');

// Create collections with indexes
db.createCollection('links');
db.createCollection('summaries');
db.createCollection('dailydigests');
db.createCollection('tenantsettings');
db.createCollection('usersettings');

// Create indexes for better performance
db.links.createIndex({ "url": 1 }, { unique: true });
db.links.createIndex({ "tenantId": 1, "createdAt": -1 });
db.links.createIndex({ "createdAt": -1 });

db.summaries.createIndex({ "linkId": 1 });
db.summaries.createIndex({ "tenantId": 1, "createdAt": -1 });

db.dailydigests.createIndex({ "tenantId": 1, "date": -1 });
db.dailydigests.createIndex({ "date": -1 });

db.tenantsettings.createIndex({ "tenantId": 1 }, { unique: true });
db.usersettings.createIndex({ "userId": 1, "tenantId": 1 }, { unique: true });

// eslint-disable-next-line no-undef
print('Database initialized successfully');