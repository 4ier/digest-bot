# Production Deployment Guide

## Prerequisites

### Server Requirements
- Ubuntu 18.04+ or CentOS 7+
- Node.js 18.0.0+
- MongoDB 6.0+
- PM2 (Process Manager)
- Nginx (Optional, for reverse proxy)

### External Services
- Feishu Developer Account
- SiliconFlow API Key (or OpenAI API Key)
- MongoDB instance (local or cloud)

## Installation Steps

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install MongoDB (if local)
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 2. Application Deployment

```bash
# Create application directory
sudo mkdir -p /var/www/digest-bot
sudo chown $USER:$USER /var/www/digest-bot
cd /var/www/digest-bot

# Clone repository
git clone <repository-url> .

# Install dependencies
npm ci --production

# Create logs directory
mkdir -p logs

# Set up environment configuration
cp .env.production .env
# Edit .env with actual values
nano .env
```

### 3. Environment Configuration

Edit `/var/www/digest-bot/.env`:

```bash
# Server Configuration
PORT=3000
NODE_ENV=production

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/feishu-digest-bot

# Feishu Bot Configuration
FEISHU_APP_ID=cli_your_app_id
FEISHU_APP_SECRET=your_app_secret
FEISHU_VERIFICATION_TOKEN=your_verification_token
FEISHU_ENCRYPT_KEY=your_encrypt_key
FEISHU_DEFAULT_CHAT_ID=oc_your_default_chat_id

# SiliconFlow Configuration
SILICONFLOW_API_KEY=your_api_key
SILICONFLOW_BASE_URL=https://api.siliconflow.cn/v1
SILICONFLOW_MODEL=deepseek-ai/DeepSeek-R1

# Alert Configuration
ALERT_WEBHOOK_URL=your_webhook_url

# Logging Configuration
LOG_LEVEL=info
LOG_FILE_PATH=logs/app.log

# Feature Flags
ENABLE_MOCK_DATA=false
ENABLE_DAILY_DIGEST=true
DIGEST_TIME=20:00
```

### 4. Feishu Bot Configuration

1. Go to [Feishu Open Platform](https://open.feishu.cn/)
2. Create a new application
3. Configure bot permissions:
   - Read and send messages in chats
   - Access user basic information
4. Set webhook URL: `https://your-domain.com/webhook`
5. Enable event subscriptions for:
   - `im.message.receive_v1`
   - `im.chat.member.bot.added_v1`

### 5. Start Application

```bash
# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Set up PM2 to start on boot
pm2 startup
# Follow the generated command

# Check status
pm2 status
pm2 logs digest-bot
```

### 6. Set Up Log Rotation

```bash
# Copy logrotate configuration
sudo cp scripts/logrotate.conf /etc/logrotate.d/feishu-digest-bot

# Test logrotate
sudo logrotate -d /etc/logrotate.d/feishu-digest-bot
```

### 7. Optional: Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
}
```

## GitHub Actions Secrets

Configure the following secrets in your GitHub repository:

- `SERVER_HOST`: Your server IP/domain
- `SERVER_USERNAME`: SSH username  
- `SERVER_SSH_KEY`: Private SSH key for deployment
- `FEISHU_APP_ID`: Feishu app ID
- `FEISHU_APP_SECRET`: Feishu app secret
- `FEISHU_VERIFICATION_TOKEN`: Feishu verification token
- `FEISHU_ENCRYPT_KEY`: Feishu encrypt key
- `FEISHU_DEFAULT_CHAT_ID`: Default chat ID
- `SILICONFLOW_API_KEY`: SiliconFlow API key
- `SILICONFLOW_BASE_URL`: SiliconFlow base URL
- `SILICONFLOW_MODEL`: SiliconFlow model name

## Monitoring and Maintenance

### Health Checks
- Health endpoint: `GET /health`
- PM2 monitoring: `pm2 monit`
- Application logs: `pm2 logs digest-bot`

### Common Commands
```bash
# Restart application
pm2 restart digest-bot

# View logs
pm2 logs digest-bot --lines 100

# Monitor resources
pm2 monit

# Update application
cd /var/www/digest-bot
git pull
npm ci --production
pm2 reload digest-bot
```

### Troubleshooting

1. **Application won't start**
   - Check environment variables in `.env`
   - Verify MongoDB connection
   - Check PM2 logs: `pm2 logs digest-bot`

2. **MongoDB connection issues**
   - Verify MongoDB is running: `sudo systemctl status mongod`
   - Check connection string in `.env`
   - Test connection: `mongo mongodb://localhost:27017/feishu-digest-bot`

3. **Feishu webhook not receiving events**
   - Verify webhook URL is accessible from internet
   - Check Feishu app configuration
   - Verify verification token matches

4. **AI service errors**
   - Check API key validity
   - Verify API endpoint accessibility
   - Check rate limits and quotas

## Security Considerations

- Keep all API keys and secrets secure
- Use HTTPS in production
- Regularly update dependencies: `npm audit fix`
- Monitor logs for suspicious activity
- Set up proper firewall rules
- Use environment variables for all sensitive data

## Backup Strategy

1. **Database Backup**
   ```bash
   mongodump --db feishu-digest-bot --out /backup/$(date +%Y%m%d)
   ```

2. **Application Backup**
   ```bash
   tar -czf /backup/digest-bot-$(date +%Y%m%d).tar.gz /var/www/digest-bot
   ```

3. **Automated Backup Script**
   ```bash
   #!/bin/bash
   # Add to crontab: 0 2 * * * /path/to/backup.sh
   DATE=$(date +%Y%m%d)
   mongodump --db feishu-digest-bot --out /backup/mongo-$DATE
   tar -czf /backup/app-$DATE.tar.gz /var/www/digest-bot
   find /backup -name "*.tar.gz" -mtime +7 -delete
   find /backup -name "mongo-*" -mtime +7 -exec rm -rf {} \;
   ```