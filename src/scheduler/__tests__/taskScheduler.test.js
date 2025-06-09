jest.mock('node-schedule', () => ({
  scheduleJob: jest.fn(() => ({ cancel: jest.fn() })),
  RecurrenceRule: jest.fn(function () { this.hour = 0; this.minute = 0; }),
}));
jest.mock('../../config', () => ({
  feishu: { appId: 'id', appSecret: 's', verificationToken: 't', defaultChatId: 'chat' },
  siliconflow: { apiKey: 'k', baseUrl: 'u', model: 'm' },
  openai: { apiKey: 'k' },
  logging: { level: 'info', filePath: 'logs/app.log' },
  server: { env: 'test' },
  features: { enableDailyDigest: true, digestTime: '10:00' },
}));
jest.mock('../../services/digest');
jest.mock('../../utils/logger');

const schedule = require('node-schedule');
const TaskScheduler = require('../taskScheduler');

describe('TaskScheduler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('schedules job on start', () => {
    const scheduler = new TaskScheduler();
    scheduler.start();
    expect(schedule.scheduleJob).toHaveBeenCalled();
  });

  test('stop cancels jobs', () => {
    const scheduler = new TaskScheduler();
    scheduler.start();
    scheduler.stop();
    const job = schedule.scheduleJob.mock.results[0].value;
    expect(job.cancel).toHaveBeenCalled();
  });
});
