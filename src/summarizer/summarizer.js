const aiService = require('../services/ai');
const contentFetcher = require('../services/contentFetcher');
const logger = require('../utils/logger');

class Summarizer {
  constructor(options = {}) {
    this.maxRetries = options.retries ?? 2;
    this.defaultStyle = options.style ?? 'bullet';
  }

  async summarize(url, options = {}) {
    const style = options.style || this.defaultStyle;
    const content = await contentFetcher.fetch(url);
    let attempt = 0;
    while (true) {
      try {
        return await aiService.generateSummary(content, { style });
      } catch (err) {
        attempt += 1;
        logger.warn('Summary generation failed', err);
        if (attempt > this.maxRetries) {
          throw err;
        }
      }
    }
  }
}

module.exports = Summarizer;
