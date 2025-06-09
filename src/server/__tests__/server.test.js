const request = require('supertest');

jest.mock('../../utils/logger');
jest.mock('../../config', () => ({
  feishu: { appId: 'id', appSecret: 'sec', verificationToken: 'token' },
  logging: { level: 'info', filePath: 'logs/app.log' },
  server: { env: 'test', port: 3000 },
  features: { enableMockData: false },
}));

const FeishuBot = require('../../bot/FeishuBot');

jest.mock('../../bot/FeishuBot');

const Server = require('../../server');

describe('Server routes', () => {
  beforeEach(() => {
    FeishuBot.mockClear();
  });

  test('health route returns ok', async () => {
    const server = new Server();
    const res = await request(server.app).get('/health');
    expect(res.body).toEqual({ status: 'ok' });
  });

  test('webhook processes message', async () => {
    const botInstance = {
      verifyRequest: jest.fn().mockReturnValue(true),
      handleMessage: jest.fn(),
    };
    FeishuBot.mockImplementation(() => botInstance);
    const server = new Server();

    const payload = {
      event: { type: 'message', message: { message_type: 'text', content: { text: 'hi' } }, chat_id: 'c', sender: { sender_id: 'u' } },
    };

    const res = await request(server.app).post('/webhook/feishu').send(payload);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(botInstance.handleMessage).toHaveBeenCalled();
  });

  test('invalid request returns 401', async () => {
    const botInstance = {
      verifyRequest: jest.fn().mockReturnValue(false),
      handleMessage: jest.fn(),
    };
    FeishuBot.mockImplementation(() => botInstance);
    const server = new Server();

    const res = await request(server.app).post('/webhook/feishu').send({});
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Invalid request' });
    expect(botInstance.handleMessage).not.toHaveBeenCalled();
  });

  test('challenge request echoes challenge', async () => {
    const botInstance = {
      verifyRequest: jest.fn().mockReturnValue(true),
      handleMessage: jest.fn(),
    };
    FeishuBot.mockImplementation(() => botInstance);
    const server = new Server();

    const res = await request(server.app)
      .post('/webhook/feishu')
      .send({ challenge: 'abc' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ challenge: 'abc' });
    expect(botInstance.handleMessage).not.toHaveBeenCalled();
  });

  test('error from handler is sent to client', async () => {
    const botInstance = {
      verifyRequest: jest.fn().mockReturnValue(true),
      handleMessage: jest.fn().mockRejectedValue(new Error('boom')),
    };
    FeishuBot.mockImplementation(() => botInstance);
    const server = new Server();

    const payload = {
      event: { type: 'message', message: { message_type: 'text', content: { text: 'hi' } }, chat_id: 'c', sender: { sender_id: 'u' } },
    };

    const res = await request(server.app).post('/webhook/feishu').send(payload);
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'boom' });
  });
});
