const aiService = require('../services/ai');
const contentFetcher = require('../services/contentFetcher');
const logger = require('../utils/logger');
const metrics = require('../services/monitoring/metrics');
const alertNotifier = require('../services/monitoring/alertNotifier');
const config = require('../config');
const mockData = require('../mock/mockData');

class Summarizer {
  constructor(options = {}) {
    this.maxRetries = options.retries ?? 2;
    this.defaultStyle = options.style ?? 'bullet';
  }

  async summarize(url, options = {}) {
    const style = options.style || this.defaultStyle;
    if (config.features.enableMockData) {
      return mockData.getMockSummary(url, style);
    }
    const content = await contentFetcher.fetch(url);
    let attempt = 0;
    const endTimer = metrics.summaryDuration.startTimer();
    while (attempt <= this.maxRetries) {
      try {
        const result = await aiService.generateSummary(content, { style });
        metrics.summarySuccess.inc();
        endTimer();
        return result;
      } catch (err) {
        attempt += 1;
        metrics.summaryFailure.inc();
        logger.warn('Summary generation failed', err);
        if (attempt > this.maxRetries) {
          endTimer();
          await alertNotifier.notify(`Summary generation failed for ${url}: ${err.message}`);
          throw err;
        }
      }
    }
  }
}

module.exports = Summarizer;
