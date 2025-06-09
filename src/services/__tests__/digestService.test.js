jest.mock('../ai');
jest.mock('../../db');
jest.mock('../../db/models/Link');
jest.mock('../../db/models/Summary');
jest.mock('../../db/models/DailyDigest');
jest.mock('../../bot/FeishuBot');
jest.mock('../../utils/logger');
jest.mock('../../config', () => ({
  feishu: { appId: 'id', appSecret: 's', verificationToken: 't', defaultChatId: 'chat' },
  siliconflow: { apiKey: 'k', baseUrl: 'u', model: 'm' },
  openai: { apiKey: 'k' },
  logging: { level: 'info', filePath: 'logs/app.log' },
  server: { env: 'test' },
}));

const DigestService = require('../digest');
const aiService = require('../ai');
const FeishuBot = require('../../bot/FeishuBot');
const db = require('../../db');
const LinkModel = require('../../db/models/Link');
const SummaryModel = require('../../db/models/Summary');
const DailyDigestModel = require('../../db/models/DailyDigest');

function mockModels(links = [], summary = null) {
  const conn = {};
  const create = jest.fn();
  LinkModel.mockReturnValue({
    find: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue(links),
    }),
  });
  SummaryModel.mockReturnValue({
    findOne: jest.fn().mockResolvedValue(summary),
  });
  DailyDigestModel.mockReturnValue({
    create,
  });
  db.connect.mockResolvedValue(conn);
  return { create };
}

describe('DigestService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('sendDigest sends message when articles exist', async () => {
    const link = { _id: '1', url: 'u', title: 't', summary: 's' };
    const { create } = mockModels([link]);
    aiService.generateDailyDigest.mockResolvedValue('digest');
    const reply = jest.fn();
    FeishuBot.mockImplementation(() => ({ replyMessage: reply }));

    const svc = new DigestService({ retries: 0 });
    await svc.sendDigest();

    expect(aiService.generateDailyDigest).toHaveBeenCalled();
    expect(reply).toHaveBeenCalled();
    expect(create).toHaveBeenCalled();
  });

  test('sendDigest does nothing without articles', async () => {
    mockModels([]);
    const svc = new DigestService();
    await svc.sendDigest();
    expect(aiService.generateDailyDigest).not.toHaveBeenCalled();
  });

  test('retries when sending fails', async () => {
    const link = { _id: '1', url: 'u', title: 't', summary: 's' };
    mockModels([link]);
    aiService.generateDailyDigest.mockResolvedValue('digest');
    const reply = jest
      .fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce();
    FeishuBot.mockImplementation(() => ({ replyMessage: reply }));

    const svc = new DigestService({ retries: 1 });
    await svc.sendDigest();

    expect(reply).toHaveBeenCalledTimes(2);
  });
});
