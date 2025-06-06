const schedule = require('node-schedule');
const config = require('../config');
const logger = require('../utils/logger');
const DigestService = require('../services/digest');

class TaskScheduler {
  constructor() {
    this.jobs = [];
    this.digestService = new DigestService();
  }

  start() {
    if (!config.features.enableDailyDigest) {
      logger.info('Daily digest feature disabled');
      return;
    }

    const [hour, minute] = config.features.digestTime.split(':').map(Number);
    const rule = new schedule.RecurrenceRule();
    rule.hour = hour;
    rule.minute = minute;

    const job = schedule.scheduleJob(rule, () => {
      this.digestService.sendDigest();
    });
    this.jobs.push(job);
    logger.info(`Scheduled daily digest at ${config.features.digestTime}`);
  }

  stop() {
    this.jobs.forEach((job) => job.cancel());
    this.jobs = [];
  }
}

module.exports = TaskScheduler;
