#!/bin/bash
# Enhanced Server Setup Script for GitHub Actions Deployment

set -e

echo "🚀 Setting up server for GitHub Actions deployment..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install Node.js 18
echo "📦 Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install PM2 globally
echo "📦 Installing PM2..."
npm install -g pm2

# Install MongoDB (if not already installed)
echo "📦 Installing MongoDB..."
if ! command -v mongod &> /dev/null; then
    wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -
    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
    apt-get update
    apt-get install -y mongodb-org
    systemctl start mongod
    systemctl enable mongod
    echo "✅ MongoDB installed and started"
else
    echo "✅ MongoDB already installed"
fi

# Create deployment user and group
DEPLOY_USER="deploy"
DEPLOY_GROUP="deploy"
DEPLOY_DIR="/var/www/digest-bot"

echo "👤 Creating deployment user..."
groupadd -f $DEPLOY_GROUP
if ! id -u $DEPLOY_USER > /dev/null 2>&1; then
    useradd -g $DEPLOY_GROUP -m -s /bin/bash $DEPLOY_USER
    echo "✅ User $DEPLOY_USER created"
else
    echo "✅ User $DEPLOY_USER already exists"
fi

# Create application directory
echo "📁 Creating application directory..."
mkdir -p $DEPLOY_DIR
chown $DEPLOY_USER:$DEPLOY_GROUP $DEPLOY_DIR

# Configure SSH access for deployment user
echo "🔐 Configuring SSH access..."
sudo -u $DEPLOY_USER mkdir -p /home/$DEPLOY_USER/.ssh
sudo -u $DEPLOY_USER chmod 700 /home/$DEPLOY_USER/.ssh

# Add deploy user to sudoers for PM2 operations
echo "🔧 Configuring sudo access for PM2..."
echo "$DEPLOY_USER ALL=(ALL) NOPASSWD: /usr/bin/pm2" > /etc/sudoers.d/deploy-pm2

# Configure firewall
echo "🔥 Configuring firewall..."
ufw allow ssh
ufw allow 3000/tcp  # Application port
ufw allow 27017/tcp # MongoDB port (if external access needed)
ufw --force enable

# Create logs directory with proper permissions
echo "📁 Creating logs directory..."
mkdir -p $DEPLOY_DIR/logs
chown -R $DEPLOY_USER:$DEPLOY_GROUP $DEPLOY_DIR

# Set up log rotation
echo "🔧 Setting up log rotation..."
if [ -f "$DEPLOY_DIR/scripts/logrotate.conf" ]; then
    cp $DEPLOY_DIR/scripts/logrotate.conf /etc/logrotate.d/feishu-digest-bot
    sed -i "s|/var/www/digest-bot|$DEPLOY_DIR|g" /etc/logrotate.d/feishu-digest-bot
    echo "✅ Log rotation configured"
fi

# Install additional dependencies
echo "📦 Installing additional system dependencies..."
apt-get install -y curl git build-essential

# Test MongoDB connection
echo "🔍 Testing MongoDB connection..."
if mongosh --eval "db.runCommand('ping').ok" > /dev/null 2>&1 || mongo --eval "db.runCommand('ping').ok" > /dev/null 2>&1; then
    echo "✅ MongoDB is running and accessible"
else
    echo "⚠️  MongoDB connection test failed"
fi

# Display server information
echo ""
echo "📊 Server Information:"
echo "Node.js version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "PM2 version: $(pm2 --version)"
echo "MongoDB status: $(systemctl is-active mongod)"
echo "Deploy user: $DEPLOY_USER"
echo "Application directory: $DEPLOY_DIR"
echo "Firewall status: $(ufw status | head -1)"

echo ""
echo "✅ Server setup complete!"
echo ""
echo "🔑 Next steps:"
echo "1. Add your SSH public key to /home/$DEPLOY_USER/.ssh/authorized_keys"
echo "2. Configure GitHub Secrets (see GITHUB_DEPLOYMENT.md)"
echo "3. Clone your repository to $DEPLOY_DIR"
echo "4. Set up your external services (Feishu, AI APIs)"
echo "5. Push to master branch to trigger deployment"
echo ""
echo "📖 For detailed instructions, see GITHUB_DEPLOYMENT.md"

echo ""
echo "🔐 SSH Key Setup Example:"
echo "On your local machine:"
echo "ssh-copy-id $DEPLOY_USER@$(hostname -I | awk '{print $1}')"
echo ""
echo "Or manually add your public key to:"
echo "/home/$DEPLOY_USER/.ssh/authorized_keys" 