#!/bin/bash
set -e

APP_NAME="kmaerm-frontend"

# Nếu truyền tham số "install" thì chạy npm install
if [ "$1" = "install" ]; then
    echo "📦 Running npm install..."
    npm install
elif [ "$1" = "ci" ]; then
    echo "📦 Running npm ci..."
    npm ci
fi

echo "🏗  Building Next.js..."
npm run build

# Kiểm tra app đã tồn tại trong PM2 chưa
if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
    echo "🔁 Restarting existing PM2 app: $APP_NAME..."
    pm2 restart "$APP_NAME"
else
    echo "🚀 Starting new PM2 app: $APP_NAME..."
    pm2 start npm --name "$APP_NAME" -- start
fi

echo "💾 Saving PM2 process list..."
pm2 save

echo "✅ Done! Server started."