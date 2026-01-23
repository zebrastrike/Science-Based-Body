#!/bin/bash

# =============================================================================
# SCIENCE BASED BODY - SSL/TLS CERTIFICATE SETUP
# =============================================================================
# Usage: ./scripts/setup-ssl.sh [domain]
# =============================================================================

set -e

DOMAIN="${1:-sciencebasedbody.com}"
EMAIL="${SSL_EMAIL:-admin@sciencebasedbody.com}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}SSL/TLS Certificate Setup${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "Domain: ${YELLOW}$DOMAIN${NC}"
echo -e "Email: ${YELLOW}$EMAIL${NC}"

# Check if certbot is installed
if ! command -v certbot &> /dev/null; then
    echo -e "${YELLOW}Installing Certbot...${NC}"
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
fi

# Check if nginx is running
if ! systemctl is-active --quiet nginx; then
    echo -e "${RED}Error: Nginx is not running${NC}"
    echo "Please start Nginx first: systemctl start nginx"
    exit 1
fi

# Obtain certificate
echo -e "\n${YELLOW}Obtaining SSL certificate...${NC}"
certbot --nginx \
    -d "$DOMAIN" \
    -d "www.$DOMAIN" \
    --non-interactive \
    --agree-tos \
    --email "$EMAIL" \
    --redirect

# Verify certificate
echo -e "\n${YELLOW}Verifying certificate...${NC}"
certbot certificates

# Setup auto-renewal
echo -e "\n${YELLOW}Setting up auto-renewal...${NC}"
systemctl enable certbot.timer
systemctl start certbot.timer

# Test renewal
echo -e "\n${YELLOW}Testing certificate renewal...${NC}"
certbot renew --dry-run

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}SSL Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Certificate locations:"
echo "  Cert: /etc/letsencrypt/live/$DOMAIN/fullchain.pem"
echo "  Key:  /etc/letsencrypt/live/$DOMAIN/privkey.pem"
echo ""
echo "Auto-renewal is configured via systemd timer"
echo "Certificates will renew automatically before expiration"
