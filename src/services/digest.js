const db = require('../db');
const LinkModel = require('../db/models/Link');
const SummaryModel = require('../db/models/Summary');
const aiService = require('./ai');
const FeishuBot = require('../bot/FeishuBot');
const logger = require('../utils/logger');
const config = require('../config');

class DigestService {
  constructor() {
    this.bot = new FeishuBot();
    this.chatId = config.feishu.defaultChatId;
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

    return aiService.generateDailyDigest(articles);
  }

  async sendDigest() {
    try {
      const digest = await this.generateDigest();
      if (!digest) {
        logger.info('No articles found for digest');
        return;
      }
      await this.bot.replyMessage(this.chatId, digest);
      logger.info('Daily digest sent');
    } catch (err) {
      logger.error('Failed to send digest:', err);
    }
  }
}

module.exports = DigestService;
