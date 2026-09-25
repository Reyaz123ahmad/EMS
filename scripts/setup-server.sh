#!/usr/bin/env bash
# ==============================================================================
# Production Ubuntu/Debian Server Provisioning & Setup Script
# ==============================================================================

set -e

echo "============================================================"
echo "🛠️ EMS MULTI-INSTANCE PRODUCTION SERVER INITIALIZATION"
echo "============================================================"

# 1. Update OS Packages
echo "🔄 [1/8] Updating package index..."
sudo apt-get update -y && sudo apt-get upgrade -y

# 2. Install Essentials & Build Tools
echo "📦 [2/8] Installing build tools and prerequisites..."
sudo apt-get install -y curl wget git build-essential ufw logrotate certbot python3-certbot-nginx

# 3. Install Node.js 20 LTS
echo "🟢 [3/8] Installing Node.js 20 LTS..."
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
node -v
npm -v

# 4. Install PM2 Globally
echo "⚡ [4/8] Installing PM2 process manager..."
sudo npm install -g pm2

# 5. Install & Configure Nginx
echo "🌐 [5/8] Installing Nginx..."
sudo apt-get install -y nginx

# 6. Create Directories & Setup Permissions
echo "📂 [6/8] Creating directories..."
sudo mkdir -p /var/www/ems-frontend
sudo mkdir -p /var/www/certbot
sudo mkdir -p /var/log/nginx
sudo chown -R $USER:$USER /var/www/ems-frontend

# Copy Nginx config if present
if [ -f "nginx/nginx.conf" ]; then
  echo "Copying nginx.conf to /etc/nginx/nginx.conf..."
  sudo cp nginx/nginx.conf /etc/nginx/nginx.conf
fi

# 7. Configure PM2 Systemd Startup
echo "⚙️ [7/8] Configuring PM2 systemd startup daemon..."
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME

# 8. Setup Logrotate
echo "📜 [8/8] Configuring logrotate..."
if [ -f "backend/logrotate.conf" ]; then
  sudo cp backend/logrotate.conf /etc/logrotate.d/ems-backend
fi

# Firewall configuration
echo "🛡️ Configuring UFW Firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

echo "🎉 Server provisioning completed successfully!"
echo "Next step: Run certbot for your domain: sudo certbot certonly --nginx -d yourdomain.com -d api.yourdomain.com"
