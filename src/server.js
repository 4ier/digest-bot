const express = require('express');
const bodyParser = require('body-parser');
const FeishuBot = require('./bot/FeishuBot');
const logger = require('./utils/logger');
const config = require('./config');
const metrics = require('./services/monitoring/metrics');
const tenantSettings = require('./services/tenantSettings');
const userSettings = require('./services/userSettings');
const mockData = require('./mock/mockData');
const alertNotifier = require('./services/monitoring/alertNotifier');

class Server {
  constructor() {
    this.app = express();
    this.bot = new FeishuBot();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
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

    // Prometheus metrics endpoint
    this.app.get('/metrics', async (req, res) => {
      res.set('Content-Type', metrics.contentType);
      res.send(await metrics.getMetrics());
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

    // User settings API
    this.app.get(
      '/api/tenants/:tenantId/users/:userId/settings',
      async (req, res) => {
        try {
          const data = await userSettings.getSettings(
            req.params.tenantId,
            req.params.userId
          );
          res.json(data);
        } catch (err) {
          logger.error('Failed to get user settings:', err);
          res.status(500).json({ error: 'Failed to get settings' });
        }
      }
    );

    this.app.put(
      '/api/tenants/:tenantId/users/:userId/settings',
      async (req, res) => {
        try {
          const data = await userSettings.updateSettings(
            req.params.tenantId,
            req.params.userId,
            req.body
          );
          res.json(data);
        } catch (err) {
          logger.error('Failed to update user settings:', err);
          res.status(500).json({ error: 'Failed to update settings' });
        }
      }
    );

    // 飞书事件回调接口
    this.app.post('/webhook/feishu', async (req, res, next) => {
      try {
        const data = this.bot.parseEvent(req.headers, req.body);
        if (!data) {
          return res.status(401).json({ error: 'Invalid request' });
        }

        const { challenge, event } = data;

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
        next(error);
      }
    });

    if (config.features.enableMockData) {
      this.app.get('/demo/mock-data', (req, res) => {
        res.json({ links: mockData.getMockLinksWithSummaries() });
      });
    }
  }

  setupErrorHandling() {
    // eslint-disable-next-line no-unused-vars
    this.app.use((err, req, res, next) => {
      logger.error('Unhandled error:', err);
      alertNotifier.notify(`Server error: ${err.message}`);
      const status = err.status || 500;
      res.status(status).json({ error: err.message || 'Internal server error' });
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
