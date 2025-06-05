const { OpenAI } = require('openai');
const config = require('../config');
const logger = require('../utils/logger');

class AIService {
  constructor() {
    this.client = new OpenAI({
      apiKey: config.siliconflow.apiKey,
      baseURL: config.siliconflow.baseUrl,
    });
  }

  /**
   * 生成文章摘要
   * @param {string} content - 文章内容
   * @returns {Promise<string>} 生成的摘要
   */
  async generateSummary(content, options = {}) {
    const style = options.style || 'bullet';
    const styleText = style === 'bullet' ? '请用条目形式' : '请用简洁段落';
    try {
      const response = await this.client.chat.completions.create({
        model: config.siliconflow.model,
        messages: [
          {
            role: 'system',
            content: `你是一个专业的文章摘要生成助手。${styleText}总结文章的主要内容，突出关键信息。`,
          },
          {
            role: 'user',
            content: `请为以下文章生成摘要：\n\n${content}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      logger.error('生成摘要失败:', error);
      throw new Error('生成摘要失败');
    }
  }

  /**
   * 生成每日摘要
   * @param {Array<Object>} articles - 文章列表
   * @returns {Promise<string>} 生成的每日摘要
   */
  async generateDailyDigest(articles) {
    try {
      const articlesText = articles
        .map((article, index) => `${index + 1}. ${article.title}\n${article.summary}`)
        .join('\n\n');

      const response = await this.client.chat.completions.create({
        model: config.siliconflow.model,
        messages: [
          {
            role: 'system',
            content: '你是一个专业的每日摘要生成助手。请根据提供的文章列表，生成一份结构清晰、重点突出的每日摘要。',
          },
          {
            role: 'user',
            content: `请根据以下文章生成每日摘要：\n\n${articlesText}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      logger.error('生成每日摘要失败:', error);
      throw new Error('生成每日摘要失败');
    }
  }

  /**
   * 分析文章类型
   * @param {string} content - 文章内容
   * @returns {Promise<string>} 文章类型
   */
  async analyzeArticleType(content) {
    try {
      const response = await this.client.chat.completions.create({
        model: config.siliconflow.model,
        messages: [
          {
            role: 'system',
            content: '你是一个文章分类助手。请分析文章内容，判断它是否与工作相关。返回 JSON 格式：{"isWorkRelated": true/false, "reason": "原因"}',
          },
          {
            role: 'user',
            content: `请分析以下文章是否与工作相关：\n\n${content}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 200,
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(response.choices[0].message.content);
      return result;
    } catch (error) {
      logger.error('分析文章类型失败:', error);
      throw new Error('分析文章类型失败');
    }
  }
}

module.exports = new AIService(); 