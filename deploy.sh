#!/bin/bash
set -e
echo "Starting games deployment..."

cd /var/www/iam-games

echo "Pulling iam-next-mongo packages..."
cd /var/www/iam-next-mongo
git fetch origin main
git reset --hard origin/main
cd /var/www/iam-games

echo "Pulling latest code..."
git checkout -- pnpm-lock.yaml tsconfig.json 2>/dev/null || true
git pull origin main

echo "Busting local package cache..."
rm -rf node_modules/.pnpm/@iam+shared-types* node_modules/@iam/shared-types
rm -rf node_modules/.pnpm/@iam+db* node_modules/@iam/db
rm -rf node_modules/.pnpm/@iam+ui* node_modules/@iam/ui

echo "Installing dependencies..."
pnpm install

if [ "$1" = "--no-clean" ]; then
  echo "Skipping cache clean..."
else
  echo "Cleaning build cache..."
  rm -rf .next
fi

echo "Building Next.js application..."
NEXT_PUBLIC_APP_URL=https://games.iameric.me NODE_ENV=production NODE_OPTIONS="--max-old-space-size=1536" pnpm build

echo "Clearing logs..."
pm2 flush

echo "Restarting server..."
pm2 delete iam-games 2>/dev/null || true
pm2 start ecosystem.config.js --env production

echo "Games deployment complete!"
pm2 logs iam-games --lines 20
