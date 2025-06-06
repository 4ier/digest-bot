jest.mock('../../db');
jest.mock('../../db/models/TenantSetting');
jest.mock('../../config', () => ({
  mongodb: { uri: 'mongodb://localhost/test' },
  feishu: { appId: 'id', appSecret: 'sec', verificationToken: 't' },
  siliconflow: { apiKey: 'k', baseUrl: 'u', model: 'm' },
  openai: { apiKey: 'k' },
  logging: { level: 'info', filePath: 'logs/app.log' },
  server: { env: 'test' },
}));

const db = require('../../db');
const createModel = require('../../db/models/TenantSetting');

let service;
let conn;
let model;

beforeEach(() => {
  model = {
    findOne: jest.fn(),
    create: jest.fn(),
    findOneAndUpdate: jest.fn(),
  };
  conn = {
    models: {},
    model: jest.fn(() => model),
  };
  db.connect.mockResolvedValue(conn);
  createModel.mockImplementation(() => {
    conn.models.TenantSetting = model;
  });
  service = require('../tenantSettings');
});

afterEach(() => {
  jest.clearAllMocks();
});

test('getSettings creates document when missing', async () => {
  model.findOne.mockResolvedValue(null);
  model.create.mockResolvedValue({ tenantId: 't1' });

  const result = await service.getSettings('t1');

  expect(model.create).toHaveBeenCalledWith({ tenantId: 't1' });
  expect(result).toEqual({ tenantId: 't1' });
});

test('updateSettings updates and returns document', async () => {
  model.findOneAndUpdate.mockResolvedValue({ tenantId: 't1', digestTime: '21:00' });

  const result = await service.updateSettings('t1', { digestTime: '21:00' });

  expect(model.findOneAndUpdate).toHaveBeenCalledWith(
    { tenantId: 't1' },
    { digestTime: '21:00' },
    { new: true, upsert: true }
  );
  expect(result).toEqual({ tenantId: 't1', digestTime: '21:00' });
});
