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
      const headers = {
        'x-lark-request-timestamp': '1',
        'x-lark-request-nonce': 'n',
      };
      const body = { token: 'test_token' };
      headers['x-lark-signature'] = require('crypto')
        .createHash('sha256')
        .update('1' + 'n' + 'test_key' + JSON.stringify(body))
        .digest('hex');
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

  describe('parseEvent', () => {
    const encryptData = (key, data) => {
      const crypto = require('crypto');
      const hash = crypto.createHash('sha256');
      hash.update(key);
      const aesKey = hash.digest();
      const iv = Buffer.alloc(16, 0);
      const cipher = crypto.createCipheriv('aes-256-cbc', aesKey, iv);
      const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
      return Buffer.concat([iv, encrypted]).toString('base64');
    };

    it('decrypts and returns event data', () => {
      const timestamp = '1';
      const nonce = 'n';
      const original = { event: { type: 'ping' } };
      const encrypt = encryptData('test_key', JSON.stringify(original));
      const body = { encrypt };
      const signature = require('crypto')
        .createHash('sha256')
        .update(timestamp + nonce + 'test_key' + JSON.stringify(body))
        .digest('hex');
      const headers = {
        'x-lark-request-timestamp': timestamp,
        'x-lark-request-nonce': nonce,
        'x-lark-signature': signature,
      };
      expect(bot.parseEvent(headers, body)).toEqual(original);
    });

    it('returns null for invalid signature', () => {
      const headers = { 'x-lark-signature': 'bad' };
      const body = { encrypt: 'abc' };
      expect(bot.parseEvent(headers, body)).toBeNull();
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
        '收到消息：test message'
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
        '收到图片消息'
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
