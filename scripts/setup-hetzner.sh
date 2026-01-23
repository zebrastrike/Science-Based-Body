#!/bin/bash

# =============================================================================
# SCIENCE BASED BODY - INITIAL HETZNER SERVER SETUP
# =============================================================================
# Run this script on a fresh Hetzner server
# Usage: curl -sSL https://raw.githubusercontent.com/.../setup-hetzner.sh | bash
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Science Based Body - Server Setup${NC}"
echo -e "${GREEN}========================================${NC}"

# Update system
echo -e "\n${YELLOW}Updating system packages...${NC}"
apt-get update && apt-get upgrade -y

# Install required packages
echo -e "\n${YELLOW}Installing required packages...${NC}"
apt-get install -y \
    curl \
    wget \
    git \
    nginx \
    certbot \
    python3-certbot-nginx \
    ufw \
    fail2ban

# Install Node.js 20
echo -e "\n${YELLOW}Installing Node.js 20...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Install PM2
echo -e "\n${YELLOW}Installing PM2...${NC}"
npm install -g pm2

# Install Docker
echo -e "\n${YELLOW}Installing Docker...${NC}"
curl -fsSL https://get.docker.com | bash
systemctl enable docker
systemctl start docker

# Install Docker Compose
echo -e "\n${YELLOW}Installing Docker Compose...${NC}"
apt-get install -y docker-compose-plugin

# Configure firewall
echo -e "\n${YELLOW}Configuring firewall...${NC}"
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 'Nginx Full'
ufw --force enable

# Configure fail2ban
echo -e "\n${YELLOW}Configuring fail2ban...${NC}"
systemctl enable fail2ban
systemctl start fail2ban

# Create application directory
echo -e "\n${YELLOW}Creating application directory...${NC}"
mkdir -p /root/science-based-body
cd /root/science-based-body

# Start Docker services
echo -e "\n${YELLOW}Starting Docker services...${NC}"
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: sbb_postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: sciencebasedbody
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: sbb_prod
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "127.0.0.1:5432:5432"

  redis:
    image: redis:7-alpine
    container_name: sbb_redis
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    ports:
      - "127.0.0.1:6379:6379"

volumes:
  postgres_data:
  redis_data:
EOF

# Generate random password for PostgreSQL
POSTGRES_PASSWORD=$(openssl rand -base64 32)
echo "POSTGRES_PASSWORD=$POSTGRES_PASSWORD" > .env
docker compose up -d

# Configure Nginx
echo -e "\n${YELLOW}Configuring Nginx...${NC}"
cat > /etc/nginx/sites-available/sciencebasedbody << 'EOF'
server {
    listen 80;
    server_name sciencebasedbody.com www.sciencebasedbody.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

ln -sf /etc/nginx/sites-available/sciencebasedbody /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# Setup PM2 startup
echo -e "\n${YELLOW}Configuring PM2 startup...${NC}"
pm2 startup systemd -u root --hp /root
pm2 save

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Server Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "PostgreSQL Password: ${YELLOW}$POSTGRES_PASSWORD${NC}"
echo -e "Save this password in your .env file!"
echo ""
echo "Next steps:"
echo "1. Point your domain DNS to this server's IP"
echo "2. Run: certbot --nginx -d sciencebasedbody.com -d www.sciencebasedbody.com"
echo "3. Copy your application files"
echo "4. Configure .env files"
echo "5. Run deployment script"
