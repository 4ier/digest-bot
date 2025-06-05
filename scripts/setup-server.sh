#!/bin/bash

# 创建部署用户
DEPLOY_USER="deploy"
DEPLOY_GROUP="deploy"
DEPLOY_DIR="/var/www/digest-bot"

# 创建用户和组
groupadd -f $DEPLOY_GROUP
useradd -g $DEPLOY_GROUP -m -s /bin/bash $DEPLOY_USER

# 创建部署目录
mkdir -p $DEPLOY_DIR
chown $DEPLOY_USER:$DEPLOY_GROUP $DEPLOY_DIR

# 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# 安装 PM2
npm install -g pm2

# 安装 MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
apt-get update
apt-get install -y mongodb-org
systemctl start mongod
systemctl enable mongod

# 配置防火墙
ufw allow ssh
ufw allow 3000/tcp  # 应用端口
ufw allow 27017/tcp # MongoDB 端口
ufw --force enable

# 创建日志目录
mkdir -p $DEPLOY_DIR/logs
chown -R $DEPLOY_USER:$DEPLOY_GROUP $DEPLOY_DIR/logs

echo "Server setup completed!" 