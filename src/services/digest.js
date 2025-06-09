const db = require('../db');
const LinkModel = require('../db/models/Link');
const SummaryModel = require('../db/models/Summary');
const aiService = require('./ai');
const FeishuBot = require('../bot/FeishuBot');
const logger = require('../utils/logger');
const config = require('../config');
const digestTemplate = require('./digestTemplate');
const DailyDigestModel = require('../db/models/DailyDigest');

class DigestService {
  constructor(options = {}) {
    this.bot = new FeishuBot();
    this.chatId = config.feishu.defaultChatId;
    this.maxRetries = options.retries ?? 2;
  }

  async generateDigest() {
    const conn = await db.connect('default');
    const Link = LinkModel(conn);
    const Summary = SummaryModel(conn);

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const links = await Link.find({ createdAt: { $gte: start, $lte: end } }).lean();
    if (links.length === 0) return null;

    const articles = await Promise.all(
      links.map(async (link) => {
        let summary = link.summary;
        if (!summary) {
          const s = await Summary.findOne({ linkId: link._id });
          summary = s?.content || '';
        }
        return { title: link.title || link.url, summary };
      })
    );

    const digestText = await aiService.generateDailyDigest(articles);
    return digestTemplate.generateMarkdown(digestText, new Date());
  }

  async sendDigest() {
    try {
      const markdown = await this.generateDigest();
      if (!markdown) {
        logger.info('No articles found for digest');
        return;
      }

      const conn = await db.connect('default');
      const Digest = DailyDigestModel(conn);
      await Digest.create({
        content: markdown,
        date: new Date(),
        tenantId: 'default',
        version: digestTemplate.VERSION,
      });

      let attempt = 0;
      while (attempt <= this.maxRetries) {
        try {
          await this.bot.replyMessage(this.chatId, markdown);
          logger.info('Daily digest sent');
          return;
        } catch (err) {
          attempt += 1;
          logger.warn('Failed to send digest attempt', attempt, err);
          if (attempt > this.maxRetries) {
            throw err;
          }
        }
      }
    } catch (err) {
      logger.error('Failed to send digest:', err);
    }
  }
}

module.exports = DigestService;
