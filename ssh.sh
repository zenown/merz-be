#!/bin/bash

# Load environment variables
source .env

# Default user
DEFAULT_USER="ec2-user"

echo "SSH to stage = 1 or production = production?";

read -r deployTo

# Determine the SSH user
SSH_USER="${DEPLOY_USER:-$DEFAULT_USER}"

# Determine the SSH endpoint based on environment variables
if [ "$deployTo" == "production" ]; then
    if [[ -z "${DEPLOY_SSH_PROD+x}" ]]; then
        echo "Production SSH not configured!"
        echo "**This script requires DEPLOY_SSH_PROD environment variable for production SSH.**"
        exit 1
    fi
    ENDPOINT="$DEPLOY_SSH_PROD"
    echo "--CONNECTING TO PRODUCTION--"
elif [ "$deployTo" == "1" ]; then
    if [[ -z "${DEPLOY_SSH_STAGE+x}" ]]; then
        echo "Stage SSH not configured!"
        echo "**This script requires DEPLOY_SSH_STAGE environment variable for stage SSH.**"
        exit 1
    fi
    ENDPOINT="$DEPLOY_SSH_STAGE"
    echo "--CONNECTING TO STAGE--"
else
    echo "Invalid input. Please enter '1' for stage or 'production' for production."
    exit 1
fi

# Print the SSH command instead of executing it
ssh -t "$SSH_USER"@"$ENDPOINT"

