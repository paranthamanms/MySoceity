#!/bin/bash
# ================================================================
# AWS EC2 Initial Setup Script
# Run this ONCE after creating your EC2 instance
# ================================================================

set -e  # Exit on error

echo "=================================================="
echo "MySociety - EC2 Initial Setup"
echo "=================================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root (use sudo)"
    exit 1
fi

echo "🔄 Step 1: Updating system packages..."
apt-get update -y
apt-get upgrade -y

echo ""
echo "🔄 Step 2: Installing Docker..."
apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Set up Docker repository
echo \
  "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io

# Start Docker
systemctl start docker
systemctl enable docker

echo "✅ Docker installed successfully"
docker --version

echo ""
echo "🔄 Step 3: Installing Docker Compose..."
DOCKER_COMPOSE_VERSION="2.20.0"
curl -L "https://github.com/docker/compose/releases/download/v${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

echo "✅ Docker Compose installed successfully"
docker-compose --version

echo ""
echo "🔄 Step 4: Installing Git..."
apt-get install -y git

echo "✅ Git installed successfully"
git --version

echo ""
echo "🔄 Step 5: Installing Certbot (Let's Encrypt SSL)..."
apt-get install -y certbot python3-certbot-nginx

echo "✅ Certbot installed successfully"

echo ""
echo "🔄 Step 6: Configuring firewall..."
apt-get install -y ufw

# Allow SSH (important!)
ufw allow 22/tcp

# Allow HTTP and HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall (answer 'y' when prompted)
echo "y" | ufw enable

echo "✅ Firewall configured"
ufw status

echo ""
echo "🔄 Step 7: Creating application directory..."
mkdir -p /opt/mysociety
mkdir -p /opt/mysociety/ssl
mkdir -p /var/www/certbot

echo "✅ Directory structure created"

echo ""
echo "🔄 Step 8: Setting up auto-start on reboot..."
cat > /etc/systemd/system/mysociety.service << 'EOF'
[Unit]
Description=MySociety Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/mysociety
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
User=root

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable mysociety.service

echo "✅ Auto-start configured"

echo ""
echo "=================================================="
echo "✅ EC2 SETUP COMPLETE!"
echo "=================================================="
echo ""
echo "Next steps:"
echo "1. Clone your application code to /opt/mysociety"
echo "2. Copy .env.production with your credentials"
echo "3. Run ./deploy.sh to build and start services"
echo ""
echo "Reboot recommended: sudo reboot"
echo "=================================================="
