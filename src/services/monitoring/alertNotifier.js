const axios = require('axios');
const config = require('../../config');
const logger = require('../../utils/logger');

class AlertNotifier {
  async notify(message) {
    const url = config.alert?.webhookUrl;
    if (!url) {
      logger.warn('Alert webhook not configured');
      return;
    }
    try {
      await axios.post(url, { text: message });
    } catch (err) {
      logger.error('Failed to send alert notification', err);
    }
  }
}

module.exports = new AlertNotifier();
