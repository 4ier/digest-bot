const config = {
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
  },

  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/feishu-digest-bot',
  },

  feishu: {
    appId: process.env.FEISHU_APP_ID,
    appSecret: process.env.FEISHU_APP_SECRET,
    verificationToken: process.env.FEISHU_VERIFICATION_TOKEN,
    encryptKey: process.env.FEISHU_ENCRYPT_KEY,
    defaultChatId: process.env.FEISHU_DEFAULT_CHAT_ID,
  },

  siliconflow: {
    apiKey: process.env.SILICONFLOW_API_KEY,
    baseUrl: process.env.SILICONFLOW_BASE_URL || 'https://api.siliconflow.cn/v1',
    model: process.env.SILICONFLOW_MODEL || 'deepseek-ai/DeepSeek-R1',
  },

  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },

  alert: {
    webhookUrl: process.env.ALERT_WEBHOOK_URL,
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || 'logs/app.log',
  },

  features: {
    enableMockData: process.env.ENABLE_MOCK_DATA === 'true',
    enableDailyDigest: process.env.ENABLE_DAILY_DIGEST !== 'false',
    digestTime: process.env.DIGEST_TIME || '20:00',
  },
};

// Validate required configuration
const requiredConfigs = [
  'feishu.appId',
  'feishu.appSecret',
  'feishu.verificationToken',
  'siliconflow.apiKey',
];

function validateConfig() {
  const missing = [];

  for (const configPath of requiredConfigs) {
    const value = configPath.split('.').reduce((obj, key) => obj?.[key], config);
    if (!value) {
      missing.push(configPath);
    }
  }

  if (missing.length > 0) {
    throw new Error(`Missing required configuration: ${missing.join(', ')}`);
  }
}

// Only validate configuration in production
if (process.env.NODE_ENV === 'production') {
  validateConfig();
}

module.exports = config;
