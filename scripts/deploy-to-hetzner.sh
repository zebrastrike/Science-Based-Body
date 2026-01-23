#!/bin/bash

# =============================================================================
# SCIENCE BASED BODY - HETZNER DEPLOYMENT SCRIPT
# =============================================================================
# Usage: ./scripts/deploy-to-hetzner.sh
# =============================================================================

set -e

# Configuration
HETZNER_IP="${HETZNER_SERVER_IP:-your_hetzner_ip}"
SSH_USER="${HETZNER_SSH_USER:-root}"
SSH_KEY="${HETZNER_SSH_KEY_PATH:-~/.ssh/hetzner_sbb}"
REMOTE_DIR="/root/science-based-body"
DOMAIN="sciencebasedbody.com"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Science Based Body - Hetzner Deployment${NC}"
echo -e "${GREEN}========================================${NC}"

# Check if SSH key exists
if [ ! -f "$SSH_KEY" ]; then
    echo -e "${RED}Error: SSH key not found at $SSH_KEY${NC}"
    echo "Please set HETZNER_SSH_KEY_PATH environment variable"
    exit 1
fi

# Function to run remote commands
run_remote() {
    ssh -i "$SSH_KEY" "$SSH_USER@$HETZNER_IP" "$1"
}

# Function to copy files
copy_to_remote() {
    scp -i "$SSH_KEY" -r "$1" "$SSH_USER@$HETZNER_IP:$2"
}

echo -e "\n${YELLOW}Step 1: Testing SSH connection...${NC}"
run_remote "echo 'SSH connection successful'"

echo -e "\n${YELLOW}Step 2: Creating remote directory structure...${NC}"
run_remote "mkdir -p $REMOTE_DIR"

echo -e "\n${YELLOW}Step 3: Syncing files to server...${NC}"
rsync -avz --progress \
    -e "ssh -i $SSH_KEY" \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '.env' \
    --exclude '.env.local' \
    --exclude 'dist' \
    --exclude '.next' \
    ./ "$SSH_USER@$HETZNER_IP:$REMOTE_DIR/"

echo -e "\n${YELLOW}Step 4: Installing dependencies...${NC}"
run_remote "cd $REMOTE_DIR/apps/api && npm ci"

echo -e "\n${YELLOW}Step 5: Running Prisma migrations...${NC}"
run_remote "cd $REMOTE_DIR/apps/api && npx prisma generate && npx prisma db push"

echo -e "\n${YELLOW}Step 6: Building application...${NC}"
run_remote "cd $REMOTE_DIR/apps/api && npm run build"

echo -e "\n${YELLOW}Step 7: Restarting PM2 processes...${NC}"
run_remote "pm2 delete sbb-api 2>/dev/null || true"
run_remote "cd $REMOTE_DIR/apps/api && pm2 start dist/main.js --name sbb-api"
run_remote "pm2 save"

echo -e "\n${YELLOW}Step 8: Checking application health...${NC}"
sleep 5
run_remote "curl -s http://localhost:3001/api/v1/health || echo 'Health check endpoint not available'"

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "API: https://$DOMAIN/api/v1"
echo -e "Swagger: https://$DOMAIN/api/docs"
