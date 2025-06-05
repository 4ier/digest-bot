jest.mock('../../config', () => ({
  feishu: { appId: 'id', appSecret: 's', verificationToken: 't' },
  siliconflow: { apiKey: 'k', baseUrl: 'u', model: 'm' },
  openai: { apiKey: 'k' },
  logging: { level: 'info', filePath: 'logs/app.log' },
  server: { env: 'test' },
}));
jest.mock('../../services/ai');
jest.mock('../../services/contentFetcher');
jest.mock('../../utils/logger');

const Summarizer = require('../summarizer');
const aiService = require('../../services/ai');
const contentFetcher = require('../../services/contentFetcher');

describe('Summarizer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('summarizes url with given style', async () => {
    const summarizer = new Summarizer({ retries: 1, style: 'bullet' });
    contentFetcher.fetch.mockResolvedValue('content');
    aiService.generateSummary.mockResolvedValue('summary');

    const result = await summarizer.summarize('http://a.com', { style: 'paragraph' });

    expect(contentFetcher.fetch).toHaveBeenCalledWith('http://a.com');
    expect(aiService.generateSummary).toHaveBeenCalledWith('content', { style: 'paragraph' });
    expect(result).toBe('summary');
  });

  test('retries on failure', async () => {
    const summarizer = new Summarizer({ retries: 1 });
    contentFetcher.fetch.mockResolvedValue('data');
    aiService.generateSummary
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce('ok');

    const result = await summarizer.summarize('http://b.com');

    expect(aiService.generateSummary).toHaveBeenCalledTimes(2);
    expect(result).toBe('ok');
  });

  test('throws after exceeding retries', async () => {
    const summarizer = new Summarizer({ retries: 1 });
    contentFetcher.fetch.mockResolvedValue('c');
    aiService.generateSummary.mockRejectedValue(new Error('err'));

    await expect(summarizer.summarize('http://c.com')).rejects.toThrow('err');
    expect(aiService.generateSummary).toHaveBeenCalledTimes(2);
  });
});
