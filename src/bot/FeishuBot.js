const { Client } = require('@larksuiteoapi/node-sdk');
const config = require('../config');
const logger = require('../utils/logger');

class FeishuBot {
  constructor() {
    this.client = new Client({
      appId: config.feishu.appId,
      appSecret: config.feishu.appSecret,
      disableTokenCache: false,
    });

    this.verificationToken = config.feishu.verificationToken;
    this.encryptKey = config.feishu.encryptKey;
  }

  /**
   * 验证飞书请求
   * @param {Object} headers - 请求头
   * @param {Object} body - 请求体
   * @returns {boolean} 验证结果
   */
  verifyRequest(headers, body) {
    try {
      // 验证 Token
      if (this.verificationToken && body.token !== this.verificationToken) {
        logger.warn('Invalid verification token');
        return false;
      }

      // TODO: 实现加密验证（如果需要）
      // if (this.encryptKey) {
      //   // 实现加密验证逻辑
      // }

      return true;
    } catch (error) {
      logger.error('Error verifying request:', error);
      return false;
    }
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

      // 根据消息类型处理
      switch (message.message_type) {
        case 'text':
          await this.handleTextMessage(message, chat_id);
          break;
        case 'image':
          await this.handleImageMessage(message, chat_id);
          break;
        default:
          logger.info('Unsupported message type:', message.message_type);
      }
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

      // TODO: 实现链接提取
      // TODO: 实现内容处理

      // 临时回复
      await this.replyMessage(chatId, '收到消息：' + text);
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
      // TODO: 实现图片处理
      await this.replyMessage(chatId, '收到图片消息');
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
