#!/bin/bash
# Docker Server Setup Script

set -e

echo "🐳 Setting up server for Docker deployment..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install required packages
echo "📦 Installing required packages..."
apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release

# Install Docker
echo "🐳 Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    systemctl start docker
    systemctl enable docker
    echo "✅ Docker installed and started"
else
    echo "✅ Docker already installed"
fi

# Install Docker Compose (standalone)
echo "🐳 Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose installed"
else
    echo "✅ Docker Compose already installed"
fi

# Create deployment user and group
DEPLOY_USER="deploy"
DEPLOY_GROUP="deploy"
DEPLOY_DIR="/var/www/digest-bot"

echo "👤 Creating deployment user..."
groupadd -f $DEPLOY_GROUP
if ! id -u $DEPLOY_USER > /dev/null 2>&1; then
    useradd -g $DEPLOY_GROUP -G docker -m -s /bin/bash $DEPLOY_USER
    echo "✅ User $DEPLOY_USER created and added to docker group"
else
    echo "✅ User $DEPLOY_USER already exists"
    usermod -aG docker $DEPLOY_USER
fi

# Create application directory
echo "📁 Creating application directory..."
mkdir -p $DEPLOY_DIR
chown $DEPLOY_USER:$DEPLOY_GROUP $DEPLOY_DIR

# Configure SSH access for deployment user
echo "🔐 Configuring SSH access..."
sudo -u $DEPLOY_USER mkdir -p /home/$DEPLOY_USER/.ssh
sudo -u $DEPLOY_USER chmod 700 /home/$DEPLOY_USER/.ssh

# Create logs directory
echo "📁 Creating logs directory..."
mkdir -p $DEPLOY_DIR/logs
chown -R $DEPLOY_USER:$DEPLOY_GROUP $DEPLOY_DIR

# Create SSL directory for certificates
echo "🔐 Creating SSL directory..."
mkdir -p $DEPLOY_DIR/ssl
chown $DEPLOY_USER:$DEPLOY_GROUP $DEPLOY_DIR/ssl

# Configure firewall
echo "🔥 Configuring firewall..."
ufw allow ssh
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw allow 3000/tcp # Application port (direct access)
ufw --force enable

# Set up log rotation for Docker containers
echo "🔧 Setting up Docker log rotation..."
cat > /etc/docker/daemon.json << 'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF

# Restart Docker to apply log rotation settings
systemctl restart docker

# Install additional system dependencies
echo "📦 Installing additional dependencies..."
apt-get install -y curl git build-essential

# Test Docker installation
echo "🔍 Testing Docker installation..."
if docker run --rm hello-world > /dev/null 2>&1; then
    echo "✅ Docker is working correctly"
else
    echo "⚠️  Docker test failed"
fi

# Test Docker Compose
echo "🔍 Testing Docker Compose..."
if docker-compose --version > /dev/null 2>&1; then
    echo "✅ Docker Compose is working"
else
    echo "⚠️  Docker Compose test failed"
fi

# Display server information
echo ""
echo "📊 Server Information:"
echo "Docker version: $(docker --version)"
echo "Docker Compose version: $(docker-compose --version)"
echo "Deploy user: $DEPLOY_USER"
echo "Application directory: $DEPLOY_DIR"
echo "Firewall status: $(ufw status | head -1)"

echo ""
echo "✅ Docker server setup complete!"
echo ""
echo "🔑 Next steps:"
echo "1. Add your SSH public key to /home/$DEPLOY_USER/.ssh/authorized_keys"
echo "2. Create a Docker Hub account and get access token"
echo "3. Configure GitHub Secrets (see DOCKER_DEPLOYMENT.md)"
echo "4. Clone your repository to $DEPLOY_DIR"
echo "5. Set up SSL certificates in $DEPLOY_DIR/ssl/"
echo "6. Push to master branch to trigger deployment"
echo ""
echo "📖 For detailed instructions, see DOCKER_DEPLOYMENT.md"

echo ""
echo "🔐 SSH Key Setup Example:"
echo "On your local machine:"
echo "ssh-copy-id $DEPLOY_USER@$(hostname -I | awk '{print $1}')"
echo ""
echo "🐳 Docker Hub Setup:"
echo "1. Create account at https://hub.docker.com"
echo "2. Create access token in Account Settings > Security"
echo "3. Add DOCKER_USERNAME and DOCKER_TOKEN to GitHub Secrets"