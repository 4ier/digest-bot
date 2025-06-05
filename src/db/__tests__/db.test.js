jest.mock('mongoose');
jest.mock('../../utils/logger');
jest.mock('../../config', () => ({
  mongodb: { uri: 'mongodb://localhost/test' },
  feishu: { appId: 'id', appSecret: 'sec', verificationToken: 't' },
  siliconflow: { apiKey: 'k', baseUrl: 'u', model: 'm' },
  openai: { apiKey: 'k' },
  logging: { level: 'info', filePath: 'logs/app.log' },
  server: { env: 'test' },
}));

const mongoose = require('mongoose');
const db = require('../index');

describe('db connector', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await db.disconnectAll();
  });

  test('connect caches connections per tenant', async () => {
    const conn = { on: jest.fn(), close: jest.fn() };
    mongoose.createConnection.mockReturnValue(conn);
    const c1 = await db.connect('a');
    const c2 = await db.connect('a');
    expect(mongoose.createConnection).toHaveBeenCalledTimes(1);
    expect(mongoose.createConnection).toHaveBeenCalledWith(
      'mongodb://localhost/test-a',
      { maxPoolSize: 10 }
    );
    expect(c1).toBe(c2);
  });

  test('disconnectAll closes all connections', async () => {
    const conn = { on: jest.fn(), close: jest.fn() };
    mongoose.createConnection.mockReturnValue(conn);
    await db.connect('a');
    await db.disconnectAll();
    expect(conn.close).toHaveBeenCalled();
  });
});
