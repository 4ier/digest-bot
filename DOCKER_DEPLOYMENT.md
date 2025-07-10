# Docker Deployment via GitHub Actions

## Overview

This guide helps you deploy the Feishu Digest Bot using Docker containers via GitHub Actions. The deployment process automatically builds Docker images, pushes them to Docker Hub, and deploys to your server using Docker Compose.

## Required GitHub Secrets

Configure these secrets in your GitHub repository (**Settings** → **Secrets and variables** → **Actions**):

### Server Configuration
```
SERVER_HOST=your.server.ip.address
SERVER_USERNAME=deploy
SERVER_SSH_KEY=your_private_ssh_key_content
```

### Docker Hub Configuration
```
DOCKER_USERNAME=your_dockerhub_username
DOCKER_TOKEN=your_dockerhub_access_token
```

### Database Configuration
```
MONGODB_URI=mongodb://admin:your_mongo_password@mongodb:27017/feishu-digest-bot?authSource=admin
MONGO_ROOT_PASSWORD=your_secure_mongodb_password
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

### Optional Configuration
```
OPENAI_API_KEY=your_openai_api_key
ALERT_WEBHOOK_URL=your_alert_webhook_url
```

## Server Setup

### 1. Run the Setup Script

On your target server, run:

```bash
# Download and run the setup script
wget https://raw.githubusercontent.com/your-repo/digest-bot/master/scripts/setup-docker-server.sh
sudo chmod +x setup-docker-server.sh
sudo ./setup-docker-server.sh
```

### 2. Manual Server Setup (Alternative)

If you prefer manual setup:

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create deploy user
sudo useradd -m -s /bin/bash deploy
sudo usermod -aG docker deploy

# Create application directory
sudo mkdir -p /var/www/digest-bot
sudo chown deploy:deploy /var/www/digest-bot

# Configure firewall
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
```

### 3. SSH Key Setup

Add your SSH public key to the deploy user:

```bash
# On your local machine
ssh-copy-id deploy@your-server-ip

# Or manually
ssh deploy@your-server-ip
mkdir -p ~/.ssh
chmod 700 ~/.ssh
# Add your public key to ~/.ssh/authorized_keys
```

### 4. Clone Repository

```bash
# As deploy user on server
cd /var/www/digest-bot
git clone https://github.com/your-username/digest-bot.git .
```

## Docker Hub Setup

1. **Create Docker Hub Account**
   - Go to [Docker Hub](https://hub.docker.com)
   - Create an account if you don't have one

2. **Create Access Token**
   - Go to Account Settings → Security
   - Click "New Access Token"
   - Name: "GitHub Actions"
   - Permissions: Read, Write, Delete
   - Copy the generated token

3. **Add to GitHub Secrets**
   - `DOCKER_USERNAME`: Your Docker Hub username
   - `DOCKER_TOKEN`: The access token you created

## SSL Certificate Setup (Optional)

For HTTPS support, add SSL certificates:

```bash
# On your server
cd /var/www/digest-bot
mkdir -p ssl

# Add your certificates
# ssl/cert.pem - Your SSL certificate
# ssl/key.pem - Your private key

# For Let's Encrypt certificates:
# ssl/fullchain.pem - Full certificate chain
# ssl/privkey.pem - Private key
```

## Deployment Process

The GitHub Action workflow automatically:

1. **Test**: Runs linting and tests
2. **Build**: Creates Docker image and pushes to Docker Hub
3. **Deploy**: 
   - SSHs into your server
   - Pulls latest code
   - Creates environment file
   - Pulls new Docker image
   - Restarts services with Docker Compose
   - Verifies deployment

## Triggering Deployment

### Automatic Deployment
Push to the `master` branch:
```bash
git push origin master
```

### Manual Deployment
1. Go to your GitHub repository
2. Click **Actions** tab
3. Select **CI/CD Docker Deployment**
4. Click **Run workflow**
5. Select branch and click **Run workflow**

## Monitoring Deployment

### 1. GitHub Actions
- View real-time progress in the Actions tab
- Check logs for any deployment issues
- Monitor build and deployment status

### 2. Server Monitoring
```bash
# Check container status
docker-compose -f docker-compose.prod.yml ps

# View application logs
docker-compose -f docker-compose.prod.yml logs app

# View all logs
docker-compose -f docker-compose.prod.yml logs

# Check health endpoints
curl http://localhost:3000/health
curl http://localhost:3000/metrics
```

### 3. Container Management
```bash
# Restart specific service
docker-compose -f docker-compose.prod.yml restart app

# View container stats
docker stats

# Access container shell
docker exec -it digest-bot-app-prod /bin/sh
```

## File Structure

After deployment, your server will have:

```
/var/www/digest-bot/
├── docker-compose.prod.yml  # Production compose file
├── nginx.conf              # Nginx configuration
├── ssl/                    # SSL certificates
├── logs/                   # Application logs
├── .env                    # Environment variables
└── scripts/                # Setup scripts
```

## Troubleshooting

### Common Issues

1. **Docker Build Fails**
   - Check Dockerfile syntax
   - Ensure dependencies are correctly specified
   - Verify base image availability

2. **Image Push Fails**
   - Verify Docker Hub credentials
   - Check `DOCKER_USERNAME` and `DOCKER_TOKEN` secrets
   - Ensure repository exists on Docker Hub

3. **Container Won't Start**
   - Check environment variables
   - Verify MongoDB connection
   - Review container logs: `docker logs digest-bot-app-prod`

4. **Health Check Fails**
   - Container may be starting slowly
   - Check firewall settings
   - Verify port 3000 is accessible

### Debugging Commands

```bash
# View container logs
docker-compose -f docker-compose.prod.yml logs app

# Check container health
docker inspect digest-bot-app-prod | grep Health

# Test database connection
docker exec digest-bot-mongodb-prod mongosh --eval "db.runCommand('ping')"

# Check network connectivity
docker network ls
docker network inspect digest-bot_digest-bot-network
```

### Emergency Rollback

```bash
# Rollback to previous image
docker-compose -f docker-compose.prod.yml down
docker pull your-username/feishu-digest-bot:previous-tag
# Update docker-compose.prod.yml with previous tag
docker-compose -f docker-compose.prod.yml up -d
```

## Scaling and Performance

### Resource Limits
The production compose file includes resource limits:
- Memory: 512MB limit, 256MB reservation
- CPU: 0.5 cores limit, 0.25 cores reservation

### Scaling Options
```bash
# Scale application instances
docker-compose -f docker-compose.prod.yml up -d --scale app=2

# Add load balancer
# Update nginx.conf for upstream configuration
```

## Security Considerations

- All secrets are encrypted in GitHub
- Docker containers run as non-root user
- Network isolation with custom Docker network
- Firewall configured for minimal exposure
- SSL/TLS encryption with Nginx
- Regular security updates via automated deployments

## Monitoring and Alerts

The application provides:
- Health endpoint: `/health`
- Metrics endpoint: `/metrics` (Prometheus format)
- Structured JSON logging
- Container health checks
- Alert webhook integration

## Next Steps

1. Configure all GitHub Secrets
2. Set up your server using the setup script
3. Configure external services (Feishu, AI APIs)
4. Push to master branch to trigger deployment
5. Monitor deployment and verify functionality
6. Set up SSL certificates for production use
7. Configure monitoring and alerting

The Docker deployment is production-ready with automatic scaling, health checks, and monitoring!