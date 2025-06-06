const express = require('express');
const bodyParser = require('body-parser');
const FeishuBot = require('./bot/FeishuBot');
const logger = require('./utils/logger');
const config = require('./config');
const tenantSettings = require('./services/tenantSettings');

class Server {
  constructor() {
    this.app = express();
    this.bot = new FeishuBot();
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    // 解析 JSON 请求体
    this.app.use(bodyParser.json());

    // 请求日志中间件
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.url}`, {
        headers: req.headers,
        body: req.body,
      });
      next();
    });
  }

  setupRoutes() {
    // 健康检查接口
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok' });
    });

    // Tenant settings API
    this.app.get('/api/tenants/:tenantId/settings', async (req, res) => {
      try {
        const data = await tenantSettings.getSettings(req.params.tenantId);
        res.json(data);
      } catch (err) {
        logger.error('Failed to get settings:', err);
        res.status(500).json({ error: 'Failed to get settings' });
      }
    });

    this.app.put('/api/tenants/:tenantId/settings', async (req, res) => {
      try {
        const data = await tenantSettings.updateSettings(
          req.params.tenantId,
          req.body
        );
        res.json(data);
      } catch (err) {
        logger.error('Failed to update settings:', err);
        res.status(500).json({ error: 'Failed to update settings' });
      }
    });

    // 飞书事件回调接口
    this.app.post('/webhook/feishu', async (req, res) => {
      try {
        // 验证请求
        if (!this.bot.verifyRequest(req.headers, req.body)) {
          return res.status(401).json({ error: 'Invalid request' });
        }

        // 处理飞书事件
        const { challenge, event } = req.body;

        // 处理验证请求
        if (challenge) {
          return res.json({ challenge });
        }

        // 处理消息事件
        if (event && event.type === 'message') {
          await this.bot.handleMessage(event);
        }

        res.json({ ok: true });
      } catch (error) {
        logger.error('Error handling webhook:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });
  }

  start() {
    const port = config.server.port;
    this.app.listen(port, () => {
      logger.info(`Server is running on port ${port}`);
    });
  }
}

module.exports = Server;
