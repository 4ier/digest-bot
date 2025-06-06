jest.mock('../../config', () => ({
  feishu: { appId: 'id', appSecret: 's', verificationToken: 't' },
  siliconflow: { apiKey: 'k', baseUrl: 'u', model: 'm' },
  openai: { apiKey: 'k' },
  logging: { level: 'info', filePath: 'logs/app.log' },
  server: { env: 'test' },
  features: { enableMockData: false },
}));
jest.mock('../../services/ai');
jest.mock('../../services/contentFetcher');
jest.mock('../../utils/logger');
jest.mock('../../services/monitoring/metrics', () => {
  const endTimer = jest.fn();
  return {
    summarySuccess: { inc: jest.fn() },
    summaryFailure: { inc: jest.fn() },
    summaryDuration: { startTimer: jest.fn(() => endTimer) },
    __endTimer: endTimer,
  };
});
jest.mock('../../services/monitoring/alertNotifier');

const Summarizer = require('../summarizer');
const aiService = require('../../services/ai');
const contentFetcher = require('../../services/contentFetcher');
const metrics = require('../../services/monitoring/metrics');
const alertNotifier = require('../../services/monitoring/alertNotifier');

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
    expect(metrics.summaryDuration.startTimer).toHaveBeenCalled();
    expect(metrics.__endTimer).toHaveBeenCalled();
    expect(metrics.summarySuccess.inc).toHaveBeenCalled();
    expect(metrics.summaryFailure.inc).not.toHaveBeenCalled();
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
    expect(metrics.summaryFailure.inc).toHaveBeenCalledTimes(1);
    expect(metrics.summarySuccess.inc).toHaveBeenCalledTimes(1);
  });

  test('throws after exceeding retries', async () => {
    const summarizer = new Summarizer({ retries: 1 });
    contentFetcher.fetch.mockResolvedValue('c');
    aiService.generateSummary.mockRejectedValue(new Error('err'));

    await expect(summarizer.summarize('http://c.com')).rejects.toThrow('err');
    expect(aiService.generateSummary).toHaveBeenCalledTimes(2);
    expect(metrics.summaryFailure.inc).toHaveBeenCalledTimes(2);
    expect(alertNotifier.notify).toHaveBeenCalled();
  });

  test('uses mock data when enabled', async () => {
    const config = require('../../config');
    config.features.enableMockData = true;
    const summarizer = new Summarizer();
    const mockData = require('../../mock/mockData');
    const result = await summarizer.summarize('http://demo.com');
    expect(result).toBe(mockData.getMockSummary('http://demo.com', 'bullet'));
    expect(aiService.generateSummary).not.toHaveBeenCalled();
  });
});
