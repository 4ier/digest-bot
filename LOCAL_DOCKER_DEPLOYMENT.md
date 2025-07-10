# Local Docker Deployment Guide (No Docker Hub Required)

## Overview

This deployment strategy builds Docker images directly on your server, eliminating the need for Docker Hub or any external image registry. The GitHub Action will SSH into your server, pull the latest code, build the Docker image locally, and deploy using Docker Compose.

## ✅ **Current GitHub Secrets Status**

You already have most of the required secrets configured:

**✅ Server Configuration:**
- `SERVER_HOST` 
- `SERVER_USERNAME`
- `SERVER_SSH_KEY`

**✅ Feishu Bot Configuration:**
- `FEISHU_APP_ID`
- `FEISHU_APP_SECRET` 
- `FEISHU_VERIFICATION_TOKEN`
- `FEISHU_ENCRYPT_KEY`
- `FEISHU_DEFAULT_CHAT_ID`

**✅ AI Service Configuration:**
- `SILICONFLOW_API_KEY`
- `SILICONFLOW_BASE_URL`
- `SILICONFLOW_MODEL`

## 🔧 **Optional Additional Secrets**

You can add these for enhanced functionality (but deployment will work without them):

```bash
# Database configuration (will use defaults if not set)
MONGODB_URI=mongodb://admin:your_password@mongodb:27017/feishu-digest-bot?authSource=admin
MONGO_ROOT_PASSWORD=your_secure_password

# Optional services
OPENAI_API_KEY=your_openai_key  # Fallback for SiliconFlow
ALERT_WEBHOOK_URL=your_webhook  # For monitoring alerts
```

## 🚀 **Server Setup**

### 1. Run the Docker Setup Script

SSH into your server and run:

```bash
# Download the setup script
curl -o setup-docker-server.sh https://raw.githubusercontent.com/your-username/digest-bot/master/scripts/setup-docker-server.sh

# Make it executable and run
chmod +x setup-docker-server.sh
sudo ./setup-docker-server.sh
```

### 2. Clone Your Repository

```bash
# Switch to deploy user
sudo su - deploy

# Create and navigate to app directory
cd /var/www/digest-bot

# Clone your repository (replace with your actual repo URL)
git clone https://github.com/your-username/digest-bot.git .
```

### 3. Set Up SSH Key for Deploy User

```bash
# On your local machine, copy your SSH key to the deploy user
ssh-copy-id deploy@your-server-ip

# Or manually add your public key
ssh deploy@your-server-ip
mkdir -p ~/.ssh
chmod 700 ~/.ssh
# Add your public key to ~/.ssh/authorized_keys
```

## 🐳 **How Local Docker Deployment Works**

### GitHub Action Process:
1. **Test Phase**: Runs all tests and linting
2. **Deploy Phase**:
   - SSH into your server
   - Pull latest code from Git
   - Create environment file with your secrets
   - Build Docker image locally: `docker build -t feishu-digest-bot:latest .`
   - Start services with: `docker-compose -f docker-compose.local.yml up -d`
   - Verify deployment health

### Benefits:
- ✅ **No Docker Hub account needed**
- ✅ **No image registry required**
- ✅ **Private deployment** - images stay on your server
- ✅ **Simple setup** - uses your existing secrets
- ✅ **Fast deployment** - builds directly where it runs

## 🚀 **Deploy Now!**

Since you already have all the required secrets configured, you can deploy immediately:

```bash
# Just push to master branch
git add .
git commit -m "Setup local Docker deployment"
git push origin master
```

The GitHub Action will automatically:
1. Run tests ✅
2. SSH to your server 📡
3. Pull latest code 📥
4. Build Docker image locally 🔨
5. Start all services 🚀
6. Verify health ✅

## 📊 **Monitoring Your Deployment**

### GitHub Actions Dashboard
- Go to your repo → **Actions** tab
- Watch real-time deployment progress
- View detailed logs

### Server Commands
```bash
# Check container status
docker-compose -f docker-compose.local.yml ps

# View application logs
docker-compose -f docker-compose.local.yml logs app

# Check health
curl http://localhost:3000/health

# View all logs
docker-compose -f docker-compose.local.yml logs
```

## 🔧 **Local Management Commands**

```bash
# Start services
docker-compose -f docker-compose.local.yml up -d

# Stop services  
docker-compose -f docker-compose.local.yml down

# Rebuild and restart
docker-compose -f docker-compose.local.yml up -d --build

# View logs
docker-compose -f docker-compose.local.yml logs -f app
```

## 🛠️ **Troubleshooting**

### If Deployment Fails:

1. **Check SSH Connection**
   ```bash
   ssh deploy@your-server-ip
   ```

2. **Verify Docker Installation**
   ```bash
   docker --version
   docker-compose --version
   ```

3. **Check Application Directory**
   ```bash
   ls -la /var/www/digest-bot
   ```

4. **View Container Logs**
   ```bash
   cd /var/www/digest-bot
   docker-compose -f docker-compose.local.yml logs app
   ```

### Common Solutions:

- **Permission issues**: Ensure deploy user owns `/var/www/digest-bot`
- **Port conflicts**: Make sure port 3000 is available
- **Memory issues**: Docker needs sufficient RAM to build images
- **Firewall**: Ensure port 3000 is accessible

## 🎯 **What's Deployed**

Your server will run:
- **MongoDB container**: Database with persistent storage
- **Application container**: Your Feishu bot (built locally)
- **Health checks**: Automatic service monitoring
- **Log management**: Centralized logging with rotation

**Access Points:**
- Application: `http://your-server-ip:3000`
- Health Check: `http://your-server-ip:3000/health`
- Metrics: `http://your-server-ip:3000/metrics`

This setup gives you a production-ready deployment without needing any external services like Docker Hub!