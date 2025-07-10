# GitHub Actions Deployment Setup Guide

## Required GitHub Secrets

To deploy via GitHub Actions, you need to configure the following secrets in your GitHub repository:

### Server Configuration
```
SERVER_HOST=your.server.ip.address
SERVER_USERNAME=your_server_username
SERVER_SSH_KEY=your_private_ssh_key_content
```

### Feishu Bot Configuration
```
FEISHU_APP_ID=cli_xxxxxxxxxxxxxxxx
FEISHU_APP_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FEISHU_VERIFICATION_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FEISHU_ENCRYPT_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FEISHU_DEFAULT_CHAT_ID=oc_xxxxxxxxxxxxx
```

### AI Service Configuration
```
SILICONFLOW_API_KEY=your_siliconflow_api_key
SILICONFLOW_BASE_URL=https://api.siliconflow.cn/v1
SILICONFLOW_MODEL=deepseek-ai/DeepSeek-R1
```

### Database and Monitoring
```
MONGODB_URI=mongodb://localhost:27017/feishu-digest-bot
ALERT_WEBHOOK_URL=your_alert_webhook_url
```

## Setting Up GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret from the list above

## Server Prerequisites

Your server must have:
- Node.js 18+ installed
- PM2 installed globally (`npm install -g pm2`)
- MongoDB running
- Git configured
- SSH access enabled
- Application directory: `/var/www/digest-bot`

### Initial Server Setup

```bash
# On your server
sudo mkdir -p /var/www/digest-bot
sudo chown $USER:$USER /var/www/digest-bot
cd /var/www/digest-bot

# Clone the repository
git clone <your-repo-url> .

# Install PM2 globally
sudo npm install -g pm2

# Set up PM2 to start on boot
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME
```

## Deployment Process

The GitHub Action will automatically:

1. **Run Tests** - Ensure code quality
2. **Build Application** - Prepare for production
3. **Deploy to Server** - SSH into server and update
4. **Update Environment** - Configure production settings
5. **Restart Services** - Reload with PM2
6. **Verify Health** - Check application status

## Triggering Deployment

### Automatic Deployment
- Push to `master` branch triggers automatic deployment
- Only deploys if all tests pass

### Manual Deployment
- Go to **Actions** tab in GitHub
- Select **CI/CD** workflow
- Click **Run workflow** → **Run workflow**

## Monitoring Deployment

1. **GitHub Actions Tab**
   - View real-time deployment progress
   - Check logs for any issues

2. **Server Monitoring**
   ```bash
   # Check PM2 status
   pm2 status
   
   # View application logs
   pm2 logs digest-bot
   
   # Check health endpoint
   curl http://localhost:3000/health
   ```

3. **Application Metrics**
   - Health: `http://your-server:3000/health`
   - Metrics: `http://your-server:3000/metrics`

## Troubleshooting

### Common Issues

1. **SSH Connection Failed**
   - Verify `SERVER_HOST`, `SERVER_USERNAME`, `SERVER_SSH_KEY`
   - Ensure SSH key has proper permissions (600)

2. **Application Won't Start**
   - Check environment variables are set correctly
   - Verify MongoDB is running
   - Check PM2 logs: `pm2 logs digest-bot`

3. **Tests Failing**
   - Review test output in GitHub Actions
   - Fix issues before deployment continues

4. **Health Check Failed**
   - Application may be starting slowly
   - Check if port 3000 is accessible
   - Verify firewall settings

### Emergency Rollback

```bash
# On server - rollback to previous version
cd /var/www/digest-bot
git log --oneline -5  # Find previous commit
git checkout <previous-commit-hash>
npm ci --production
pm2 reload ecosystem.config.js
```

## Security Notes

- All secrets are encrypted in GitHub
- SSH keys should be generated specifically for deployment
- Never commit secrets to the repository
- Regularly rotate API keys and passwords

## Next Steps After Setup

1. Configure all GitHub secrets
2. Ensure server meets prerequisites
3. Push to master branch or trigger manual deployment
4. Monitor deployment in GitHub Actions
5. Verify application is running via health checks

The deployment is fully automated and production-ready!