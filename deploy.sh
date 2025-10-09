#!/bin/bash

# Install dependencies
npm install

# Build project
npm run build

# Restart PM2 process
pm2 stop MerzStageAPI
pm2 delete MerzStageAPI -s

pm2 start "cd /home/ec2-user/merz-be && npm run start" --name MerzStageAPI

# Show logs for 5 seconds, then exit
pm2 logs MerzStageAPI --lines 1000 &
LOG_PID=$!
sleep 5
kill $LOG_PID
