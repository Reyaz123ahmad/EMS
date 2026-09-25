#!/usr/bin/env bash
# ==============================================================================
# Production Emergency Rollback Script
# ==============================================================================

set -e

echo "============================================================"
echo "⏪ EMS EMERGENCY ROLLBACK UTILITY"
echo "============================================================"

echo "Displaying last 5 Git commits:"
git log -n 5 --oneline --decorate

echo ""
read -p "Enter the Git commit hash to roll back to: " TARGET_COMMIT

if [ -z "$TARGET_COMMIT" ]; then
  echo "❌ Error: Commit hash cannot be empty."
  exit 1
fi

echo "🔄 Checking out commit ${TARGET_COMMIT}..."
git checkout "$TARGET_COMMIT"

echo "📦 Re-installing dependencies..."
cd backend
npm ci --production=false
cd ../frontend
npm ci
cd ..

echo "🗄️ Updating Prisma client..."
cd backend
npx prisma generate
cd ..

echo "⚛️ Rebuilding frontend..."
cd frontend
npm run build
sudo cp -r dist/* /var/www/ems-frontend/
cd ..

echo "⚡ Reloading PM2 processes..."
cd backend
npx pm2 reload ecosystem.config.cjs --update-env
cd ..

echo "🌐 Reloading Nginx..."
sudo systemctl reload nginx

echo "🩺 Verifying health after rollback..."
bash ./scripts/health-check.sh

echo "🎉 Rollback to commit ${TARGET_COMMIT} completed successfully!"
