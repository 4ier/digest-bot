const FeishuBot = require('../FeishuBot');

// Mock dependencies
jest.mock('@larksuiteoapi/node-sdk', () => {
  return {
    Client: jest.fn().mockImplementation(() => ({
      im: {
        message: {
          create: jest.fn(),
        },
      },
    })),
  };
});
jest.mock('../../utils/logger');
jest.mock('../../db', () => ({ connect: jest.fn(async () => ({})) }));
jest.mock('../../db/models/Link', () => jest.fn(() => ({ create: jest.fn(), updateOne: jest.fn() })));
jest.mock('../../db/models/Summary', () => jest.fn(() => ({ create: jest.fn() })));
jest.mock('../../parser/linkExtractor', () => jest.fn(() => ({ extract: jest.fn(() => []) })));
jest.mock('../../parser/linkValidator', () => jest.fn(() => ({ validate: jest.fn(async () => ({ valid: true, title: 't' })) })));
jest.mock('../../summarizer/summarizer', () => jest.fn(() => ({ summarize: jest.fn(async () => 's'), defaultStyle: 'bullet' })));
jest.mock('../../config', () => ({
  feishu: {
    appId: 'test_app_id',
    appSecret: 'test_app_secret',
    verificationToken: 'test_token',
    encryptKey: 'test_key',
  },
  logging: {
    filePath: 'logs/test.log',
    level: 'info',
  },
  server: {
    env: 'test',
  },
}));

describe('FeishuBot', () => {
  let bot;

  beforeEach(() => {
    bot = new FeishuBot();
  });

  describe('verifyRequest', () => {
    it('should return true for valid token', () => {
      const headers = {};
      const body = { token: 'test_token' };
      expect(bot.verifyRequest(headers, body)).toBe(true);
    });

    it('should return false for invalid token', () => {
      const headers = {};
      const body = { token: 'invalid_token' };
      expect(bot.verifyRequest(headers, body)).toBe(false);
    });

    it('should handle errors gracefully', () => {
      const headers = null;
      const body = null;
      expect(bot.verifyRequest(headers, body)).toBe(false);
    });
  });

  describe('handleMessage', () => {
    it('should handle text message', async () => {
      const event = {
        message: {
          message_type: 'text',
          content: { text: 'test message' },
        },
        sender: { sender_id: 'test_sender' },
        chat_id: 'test_chat',
      };

      // Mock replyMessage
      bot.replyMessage = jest.fn();

      await bot.handleMessage(event);

      expect(bot.replyMessage).toHaveBeenCalledWith(
        'test_chat',
        '未识别到链接'
      );
    });

    it('should handle image message', async () => {
      const event = {
        message: {
          message_type: 'image',
          content: {},
        },
        sender: { sender_id: 'test_sender' },
        chat_id: 'test_chat',
      };

      // Mock replyMessage
      bot.replyMessage = jest.fn();

      await bot.handleMessage(event);

      expect(bot.replyMessage).toHaveBeenCalledWith(
        'test_chat',
        '暂不支持处理图片消息'
      );
    });

    it('should ignore messages from bots', async () => {
      const event = {
        message: {
          message_type: 'text',
          content: { text: 'hi' },
        },
        sender: { sender_id: 'bot', sender_type: 'bot' },
        chat_id: 'test_chat',
      };

      bot.replyMessage = jest.fn();

      await bot.handleMessage(event);

      expect(bot.replyMessage).not.toHaveBeenCalled();
    });

    it('should handle unsupported message type', async () => {
      const event = {
        message: {
          message_type: 'unsupported',
          content: {},
        },
        sender: { sender_id: 'test_sender' },
        chat_id: 'test_chat',
      };

      // Mock replyMessage
      bot.replyMessage = jest.fn();

      await bot.handleMessage(event);

      expect(bot.replyMessage).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const event = {
        message: {
          message_type: 'text',
          content: { text: 'test message' },
        },
        sender: { sender_id: 'test_sender' },
        chat_id: 'test_chat',
      };

      // Mock replyMessage to throw error
      bot.replyMessage = jest.fn().mockRejectedValue(new Error('Test error'));

      await expect(bot.handleMessage(event)).rejects.toThrow('Test error');
    });
  });

  describe('replyMessage', () => {
    it('should send message successfully', async () => {
      const chatId = 'test_chat';
      const content = 'test message';

      // Mock client.im.message.create
      bot.client.im.message.create = jest.fn().mockResolvedValue({});

      await bot.replyMessage(chatId, content);

      expect(bot.client.im.message.create).toHaveBeenCalledWith({
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
    });

    it('should handle errors gracefully', async () => {
      const chatId = 'test_chat';
      const content = 'test message';

      // Mock client.im.message.create to throw error
      bot.client.im.message.create = jest.fn().mockRejectedValue(new Error('Test error'));

      await expect(bot.replyMessage(chatId, content)).rejects.toThrow('Test error');
    });
  });
});
