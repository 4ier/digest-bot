require('dotenv').config();
const Server = require('./server');
const logger = require('./utils/logger');
const TaskScheduler = require('./scheduler/taskScheduler');

// Initialize application
async function init() {
  try {
    logger.info('Starting Feishu Digest Bot...');

    // 启动 HTTP 服务器
    const server = new Server();
    server.start();

    // 启动定时任务
    const scheduler = new TaskScheduler();
    scheduler.start();

    logger.info('Feishu Digest Bot started successfully');
  } catch (error) {
    logger.error('Failed to start Feishu Digest Bot:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the application
init();
