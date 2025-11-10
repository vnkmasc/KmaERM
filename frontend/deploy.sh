pm2 stop nextjs-fe
cd /root/KmaERM/frontend || exit 1

if [ "$1" = "reinstall" ]; then
    npm install
fi

npm run build
HOST=0.0.0.0 pm2 start npm --name nextjs-fe -- start
pm2 save
pm2 restart nextjs-fe