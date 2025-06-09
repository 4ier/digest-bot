const { Client } = require('@larksuiteoapi/node-sdk');
const crypto = require('crypto');
const config = require('../config');
const logger = require('../utils/logger');
const MessageDispatcher = require('./MessageDispatcher');
const db = require('../db');
const createLinkModel = require('../db/models/Link');
const createSummaryModel = require('../db/models/Summary');
const LinkExtractor = require('../parser/linkExtractor');
const LinkValidator = require('../parser/linkValidator');
const Summarizer = require('../summarizer/summarizer');

class FeishuBot {
  constructor(options = {}) {
    this.client = new Client({
      appId: config.feishu.appId,
      appSecret: config.feishu.appSecret,
      disableTokenCache: false,
    });

    this.verificationToken = config.feishu.verificationToken;
    this.encryptKey = config.feishu.encryptKey;

    this.extractor = new LinkExtractor();
    this.validator = new LinkValidator();
    this.summarizer = new Summarizer();

    this.dispatcher = new MessageDispatcher(options.dispatcherOptions);
    this.dispatcher.registerHandler('text', async (event) => {
      await this.handleTextMessage(event.message, event.chat_id);
    });
    this.dispatcher.registerHandler('image', async (event) => {
      await this.handleImageMessage(event.message, event.chat_id);
    });
  }

  /**
   * 验证飞书请求
   * @param {Object} headers - 请求头
   * @param {Object} body - 请求体
   * @returns {boolean} 验证结果
   */
  verifyRequest(headers, body) {
    try {
      if (this.verificationToken && body?.token) {
        if (body.token !== this.verificationToken) {
          logger.warn('Invalid verification token');
          return false;
        }
      }

      if (this.encryptKey) {
        const timestamp = headers['x-lark-request-timestamp'];
        const nonce = headers['x-lark-request-nonce'];
        const signature = headers['x-lark-signature'];
        const content = timestamp + nonce + this.encryptKey + JSON.stringify(body);
        const computed = crypto.createHash('sha256').update(content).digest('hex');
        if (signature !== computed) {
          logger.warn('Invalid request signature');
          return false;
        }
      }

      return true;
    } catch (error) {
      logger.error('Error verifying request:', error);
      return false;
    }
  }

  decrypt(encrypt) {
    const hash = crypto.createHash('sha256');
    hash.update(this.encryptKey);
    const key = hash.digest();
    const buffer = Buffer.from(encrypt, 'base64');
    const iv = buffer.slice(0, 16);
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(buffer.slice(16).toString('hex'), 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  parseEvent(headers, body) {
    if (!this.verifyRequest(headers, body)) {
      return null;
    }
    if (body.encrypt) {
      try {
        const decrypted = this.decrypt(body.encrypt);
        return JSON.parse(decrypted);
      } catch (err) {
        logger.error('Failed to decrypt body:', err);
        return null;
      }
    }
    return body;
  }

  /**
   * 处理消息事件
   * @param {Object} event - 消息事件
   * @returns {Promise<void>}
   */
  async handleMessage(event) {
    try {
      const { message, sender, chat_id } = event;

      // 记录消息
      logger.info('Received message:', {
        chatId: chat_id,
        senderId: sender.sender_id,
        messageType: message.message_type,
      });

      await this.dispatcher.dispatch(event);
    } catch (error) {
      logger.error('Error handling message:', error);
      throw error;
    }
  }

  /**
   * 处理文本消息
   * @param {Object} message - 消息对象
   * @param {string} chatId - 群聊ID
   * @returns {Promise<void>}
   */
  async handleTextMessage(message, chatId) {
    try {
      const text = message.content.text;
      const links = this.extractor.extract(text);

      if (links.length === 0) {
        await this.replyMessage(chatId, '未识别到链接');
        return;
      }

      const conn = await db.connect('default');
      const Link = createLinkModel(conn);
      const Summary = createSummaryModel(conn);

      let saved = 0;
      for (const info of links) {
        try {
          const meta = await this.validator.validate(info.url);
          if (!meta.valid) continue;

          const linkDoc = await Link.create({
            url: info.url,
            platform: info.platform,
            category: info.category,
            title: meta.title,
            tenantId: 'default',
          });

          const summary = await this.summarizer.summarize(info.url);
          await Summary.create({
            linkId: linkDoc._id,
            content: summary,
            style: this.summarizer.defaultStyle,
            tenantId: 'default',
          });
          await Link.updateOne({ _id: linkDoc._id }, { summary });
          saved += 1;
        } catch (err) {
          logger.error('Failed to process link:', err);
        }
      }

      await this.replyMessage(chatId, `已保存${saved}条链接`);
    } catch (error) {
      logger.error('Error handling text message:', error);
      throw error;
    }
  }

  /**
   * 处理图片消息
   * @param {Object} message - 消息对象
   * @param {string} chatId - 群聊ID
   * @returns {Promise<void>}
   */
  async handleImageMessage(message, chatId) {
    try {
      await this.replyMessage(chatId, '暂不支持处理图片消息');
    } catch (error) {
      logger.error('Error handling image message:', error);
      throw error;
    }
  }

  /**
   * 回复消息
   * @param {string} chatId - 群聊ID
   * @param {string} content - 回复内容
   * @returns {Promise<void>}
   */
  async replyMessage(chatId, content) {
    try {
      await this.client.im.message.create({
        params: {
          receive_id_type: 'chat_id',
        },
        data: {
          receive_id: chatId,
          content: JSON.stringify({
            text: content,
          }),
          msg_type: 'text',
        },
      });
    } catch (error) {
      logger.error('Error replying message:', error);
      throw error;
    }
  }
}

module.exports = FeishuBot;
