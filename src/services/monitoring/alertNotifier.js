const axios = require('axios');
const config = require('../../config');
const logger = require('../../utils/logger');

class AlertNotifier {
  constructor() {
    this.webhookUrl = config.alert?.webhookUrl;
    this.enabled = !!this.webhookUrl;
  }

  async notify(message) {
    if (!this.enabled) {
      logger.warn('Alert webhook not configured');
      return;
    }
    try {
      await axios.post(this.webhookUrl, {
        text: message,
        timestamp: new Date().toISOString(),
        service: 'feishu-digest-bot',
        environment: config.server.env,
      }, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      logger.info('Alert notification sent successfully');
    } catch (err) {
      logger.error('Failed to send alert notification', err);
    }
  }

  async sendAlert(level, message, details = {}) {
    const alert = {
      level,
      message,
      details,
      timestamp: new Date().toISOString(),
      service: 'feishu-digest-bot',
      environment: config.server.env,
    };

    if (!this.enabled) {
      logger.warn('Alert webhook not configured, logging alert locally', alert);
      return;
    }

    try {
      await axios.post(this.webhookUrl, alert, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      logger.info('Alert sent successfully', { level, message });
    } catch (error) {
      logger.error('Failed to send alert', {
        error: error.message,
        level,
        message,
        details,
      });
    }
  }

  async sendError(error, context = {}) {
    await this.sendAlert('error', error.message, {
      stack: error.stack,
      context,
    });
  }

  async sendWarning(message, details = {}) {
    await this.sendAlert('warning', message, details);
  }

  async sendInfo(message, details = {}) {
    await this.sendAlert('info', message, details);
  }

  async sendCritical(message, details = {}) {
    await this.sendAlert('critical', message, details);
  }
}

module.exports = new AlertNotifier();
