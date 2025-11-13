#!/bin/bash

# Nếu truyền tham số "install" thì chạy npm install
if [ "$1" = "install" ]; then
    echo "📦 Running npm install..."
    npm install
fi

echo "🏗  Building Next.js..."
npm run build

echo "💾 Saving PM2 process list..."
pm2 save

APP_NAME="kmaerm-frontend"

# Kiểm tra app đã tồn tại trong PM2 chưa
if pm2 list | grep -q "$APP_NAME"; then
    echo "🔁 Restarting existing PM2 app: $APP_NAME..."
    pm2 restart $APP_NAME
else
    echo "🚀 Starting new PM2 app: $APP_NAME..."
    pm2 start npm --name "$APP_NAME" -- start
fi

echo "✅ Done! Server started."
