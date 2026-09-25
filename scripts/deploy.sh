#!/usr/bin/env bash
# ==============================================================================
# Automated Production Zero-Downtime Deployment Script
# ==============================================================================

set -e # Exit immediately on error

echo "🚀 [1/7] Pulling latest production code from repository..."
git fetch origin
git pull origin main

echo "📦 [2/7] Installing dependencies (clean install)..."
cd backend
npm ci --production=false
cd ../frontend
npm ci
cd ..

echo "🗄️ [3/7] Running database migrations..."
cd backend
npx prisma generate
npx prisma migrate deploy
cd ..

echo "⚛️ [4/7] Building production frontend bundle..."
cd frontend
npm run build
echo "📂 Copying build artifacts to /var/www/ems-frontend..."
sudo mkdir -p /var/www/ems-frontend
sudo cp -r dist/* /var/www/ems-frontend/
cd ..

echo "⚡ [5/7] Executing PM2 Zero-Downtime Reload..."
cd backend
mkdir -p logs
npx pm2 reload ecosystem.config.cjs --update-env
cd ..

echo "🌐 [6/7] Testing & Reloading Nginx configuration..."
sudo nginx -t
sudo systemctl reload nginx

echo "🩺 [7/7] Running Post-Deployment Health Checks..."
bash ./scripts/health-check.sh

echo "🎉 Deployment successfully completed with ZERO downtime!"
