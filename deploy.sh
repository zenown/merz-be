#!/bin/bash

echo "#############################################"
echo "####       MERZ STAGE API DEPLOY         ####"
echo "#############################################"

COMMANDTORUN=""
ENDPOINT=""

echo ""
echo "Where do you want to deploy?"
echo "Type '1' for STAGE or 'production' for PRODUCTION:"
read -r deployTo

if [ "$deployTo" == "production" ]; then
    echo "---------------------------------------------"
    echo "🚀 DEPLOYING TO PRODUCTION"
    echo "---------------------------------------------"
    
    ENDPOINT="ch.prod.ssh.merz.zenown.com"
    COMMANDTORUN+="cd /home/ec2-user/merz-be; "
    COMMANDTORUN+="git stash push -u -m 'auto-deploy $(date +'%F %T')'; "
    COMMANDTORUN+="git pull --rebase origin master; "
    COMMANDTORUN+="npm ci; "
    COMMANDTORUN+="npm run build; "
    COMMANDTORUN+="pm2 stop MerzStageAPI || true; "
    COMMANDTORUN+="pm2 delete MerzStageAPI -s || true; "
    COMMANDTORUN+="pm2 start 'bash -lc \"cd /home/ec2-user/merz-be && npm run start\"' --name MerzStageAPI; "
    COMMANDTORUN+="pm2 logs MerzStageAPI --lines 200 & sleep 5; pkill -f 'pm2 logs MerzStageAPI'; "
    echo "✅ Command ready for PRODUCTION"

elif [ "$deployTo" == "1" ]; then
    echo "---------------------------------------------"
    echo "🚀 DEPLOYING TO STAGE"
    echo "---------------------------------------------"

    ENDPOINT="ch.dev.ssh.merz.zenown.com"
    COMMANDTORUN+="cd /home/ec2-user/merz-be; "
    COMMANDTORUN+="git stash push -u -m 'auto-deploy $(date +'%F %T')'; "
    COMMANDTORUN+="git pull --rebase origin develop; "
    COMMANDTORUN+="npm ci; "
    COMMANDTORUN+="npm run build; "
    COMMANDTORUN+="pm2 stop MerzStageAPI || true; "
    COMMANDTORUN+="pm2 delete MerzStageAPI -s || true; "
    COMMANDTORUN+="pm2 start 'bash -lc \"cd /home/ec2-user/merz-be && npm run start\"' --name MerzStageAPI; "
    COMMANDTORUN+="pm2 logs MerzStageAPI --lines 200 & sleep 5; pkill -f 'pm2 logs MerzStageAPI'; "
    echo "✅ Command ready for STAGE"

else
    echo ""
    echo "------------------------------------------"
    echo "❌ You had two options and you blew it! 😂"
    echo "------------------------------------------"
    exit 1
fi

echo ""
echo "---------------------------------------------"
echo "Connecting to: ec2-user@$ENDPOINT"
echo "Executing remote deploy commands..."
echo "---------------------------------------------"

ssh -tt ec2-user@"$ENDPOINT" "$COMMANDTORUN"

echo ""
echo "✅ Deployment finished on $ENDPOINT!"
echo "---------------------------------------------"
