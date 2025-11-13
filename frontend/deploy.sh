if [ "$1" = "reinstall" ]; then
    npm install
fi

npm run build
pm2 save
pm2 restart kmaerm-frontend