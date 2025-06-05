let OpenAI;
// AIService will be required after mocks are set up

jest.mock('openai', () => ({ OpenAI: jest.fn() }));
jest.mock('../../utils/logger');
jest.mock('../../config', () => ({
  siliconflow: { apiKey: 'k', baseUrl: 'u', model: 'm' },
  openai: { apiKey: 'k' },
  feishu: { appId: 'id', appSecret: 's', verificationToken: 't' },
  logging: { level: 'info', filePath: 'logs/app.log' },
  server: { env: 'test' },
}));

describe('AIService', () => {
  let createMock;

  beforeEach(() => {
    jest.resetModules();
    OpenAI = require('openai').OpenAI;
    createMock = jest.fn().mockResolvedValue({ choices: [{ message: { content: ' result ' } }] });
    OpenAI.mockImplementation(() => ({ chat: { completions: { create: createMock } } }));
  });

  test('generateSummary passes style', async () => {
    const ai = require('../ai');
    const summary = await ai.generateSummary('text', { style: 'paragraph' });
    const call = createMock.mock.calls[0][0];
    expect(call.messages[0].content).toContain('简洁段落');
    expect(summary).toBe('result');
  });

  test('generateSummary throws on error', async () => {
    createMock.mockRejectedValue(new Error('bad'));
    const ai = require('../ai');
    await expect(ai.generateSummary('a')).rejects.toThrow('生成摘要失败');
  });
});
