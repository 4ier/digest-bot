jest.mock('../ai');
jest.mock('../../db');
jest.mock('../../db/models/Link');
jest.mock('../../db/models/Summary');
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

function mockModels(links = [], summary = null) {
  const conn = {};
  LinkModel.mockReturnValue({
    find: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue(links),
    }),
  });
  SummaryModel.mockReturnValue({
    findOne: jest.fn().mockResolvedValue(summary),
  });
  db.connect.mockResolvedValue(conn);
}

describe('DigestService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('sendDigest sends message when articles exist', async () => {
    const link = { _id: '1', url: 'u', title: 't', summary: 's' };
    mockModels([link]);
    aiService.generateDailyDigest.mockResolvedValue('digest');
    const reply = jest.fn();
    FeishuBot.mockImplementation(() => ({ replyMessage: reply }));

    const svc = new DigestService();
    await svc.sendDigest();

    expect(aiService.generateDailyDigest).toHaveBeenCalled();
    expect(reply).toHaveBeenCalledWith('chat', 'digest');
  });

  test('sendDigest does nothing without articles', async () => {
    mockModels([]);
    const svc = new DigestService();
    await svc.sendDigest();
    expect(aiService.generateDailyDigest).not.toHaveBeenCalled();
  });
});
