#!/bin/bash

# =============================================================================
# SCIENCE BASED BODY - HETZNER SERVER SETUP
# =============================================================================
# Run on a fresh Ubuntu 22.04 Hetzner Cloud server
# Usage: bash setup-hetzner.sh
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
echo_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
echo_step() { echo -e "\n${BLUE}▸ $1${NC}"; }

# Configuration
APP_USER="sbb"
APP_DIR="/opt/science-based-body"
DOMAIN="api.sciencebasedbody.com"

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}     Science Based Body - Production Server Setup${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
echo ""

# =============================================================================
# STEP 1: SYSTEM UPDATE
# =============================================================================
echo_step "1/9 Updating system packages..."
apt-get update && apt-get upgrade -y
apt-get install -y \
    curl wget git htop vim nano \
    apt-transport-https ca-certificates \
    gnupg lsb-release software-properties-common

# =============================================================================
# STEP 2: CREATE APPLICATION USER
# =============================================================================
echo_step "2/9 Creating application user..."
if ! id "$APP_USER" &>/dev/null; then
    useradd -m -s /bin/bash -G sudo,docker "$APP_USER"
    echo_info "User '$APP_USER' created"
else
    echo_info "User '$APP_USER' already exists"
fi

# Create app directory
mkdir -p "$APP_DIR"
chown -R "$APP_USER:$APP_USER" "$APP_DIR"

# =============================================================================
# STEP 3: INSTALL DOCKER
# =============================================================================
echo_step "3/9 Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | bash
    systemctl enable docker
    systemctl start docker
    usermod -aG docker "$APP_USER"
    echo_info "Docker installed"
else
    echo_info "Docker already installed"
fi

# Install Docker Compose plugin
apt-get install -y docker-compose-plugin

# =============================================================================
# STEP 4: CONFIGURE FIREWALL (UFW)
# =============================================================================
echo_step "4/9 Configuring firewall..."

# Install UFW if not present
apt-get install -y ufw

# Reset and configure
ufw --force reset
ufw default deny incoming
ufw default allow outgoing

# Allow SSH (IMPORTANT: don't lock yourself out!)
ufw allow 22/tcp comment 'SSH'

# Allow HTTP/HTTPS
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'

# WireGuard VPN (optional - port 51820)
ufw allow 51820/udp comment 'WireGuard VPN'

# Enable firewall
ufw --force enable

echo_info "Firewall configured. Open ports: SSH(22), HTTP(80), HTTPS(443), WireGuard(51820)"
ufw status numbered

# =============================================================================
# STEP 5: INSTALL FAIL2BAN (Brute Force Protection)
# =============================================================================
echo_step "5/9 Configuring fail2ban..."
apt-get install -y fail2ban

cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5
ignoreip = 127.0.0.1/8

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 86400
EOF

systemctl enable fail2ban
systemctl restart fail2ban
echo_info "fail2ban configured - 3 failed SSH attempts = 24hr ban"

# =============================================================================
# STEP 6: INSTALL WIREGUARD VPN (Optional but Recommended)
# =============================================================================
echo_step "6/9 Installing WireGuard VPN..."
apt-get install -y wireguard wireguard-tools

# Generate server keys if they don't exist
WG_DIR="/etc/wireguard"
if [ ! -f "$WG_DIR/server_private.key" ]; then
    wg genkey | tee "$WG_DIR/server_private.key" | wg pubkey > "$WG_DIR/server_public.key"
    chmod 600 "$WG_DIR/server_private.key"

    SERVER_PRIVATE=$(cat "$WG_DIR/server_private.key")
    SERVER_PUBLIC=$(cat "$WG_DIR/server_public.key")

    # Create WireGuard config
    cat > "$WG_DIR/wg0.conf" << EOF
[Interface]
Address = 10.0.0.1/24
ListenPort = 51820
PrivateKey = $SERVER_PRIVATE
PostUp = iptables -A FORWARD -i wg0 -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i wg0 -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE

# Add client peers below
# [Peer]
# PublicKey = <client-public-key>
# AllowedIPs = 10.0.0.2/32
EOF

    chmod 600 "$WG_DIR/wg0.conf"

    # Enable IP forwarding
    echo "net.ipv4.ip_forward = 1" >> /etc/sysctl.conf
    sysctl -p

    echo_info "WireGuard installed"
    echo_info "Server public key: $SERVER_PUBLIC"
    echo_warn "Save this key to configure your client!"
else
    echo_info "WireGuard already configured"
fi

# =============================================================================
# STEP 7: GENERATE PRODUCTION SECRETS
# =============================================================================
echo_step "7/9 Generating production secrets..."

SECRETS_FILE="$APP_DIR/.env.secrets"
if [ ! -f "$SECRETS_FILE" ]; then
    DB_PASSWORD=$(openssl rand -base64 24 | tr -d '=+/')
    REDIS_PASSWORD=$(openssl rand -base64 24 | tr -d '=+/')
    JWT_SECRET=$(openssl rand -base64 32)
    ENCRYPTION_KEY=$(openssl rand -hex 32)

    cat > "$SECRETS_FILE" << EOF
# Generated secrets - KEEP SECURE!
# Generated on: $(date)

DB_PASSWORD=$DB_PASSWORD
REDIS_PASSWORD=$REDIS_PASSWORD
JWT_SECRET=$JWT_SECRET
ENCRYPTION_KEY=$ENCRYPTION_KEY
EOF

    chmod 600 "$SECRETS_FILE"
    chown "$APP_USER:$APP_USER" "$SECRETS_FILE"

    echo_info "Secrets generated and saved to $SECRETS_FILE"
else
    echo_info "Secrets file already exists"
fi

# =============================================================================
# STEP 8: GENERATE SELF-SIGNED SSL FOR NGINX DEFAULT SERVER
# =============================================================================
echo_step "8/9 Generating self-signed SSL certificate..."

NGINX_SSL_DIR="$APP_DIR/nginx/ssl"
mkdir -p "$NGINX_SSL_DIR"

if [ ! -f "$NGINX_SSL_DIR/default.crt" ]; then
    openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
        -keyout "$NGINX_SSL_DIR/default.key" \
        -out "$NGINX_SSL_DIR/default.crt" \
        -subj "/C=US/ST=State/L=City/O=ScienceBasedBody/CN=localhost"
    chmod 600 "$NGINX_SSL_DIR/default.key"
    chown -R "$APP_USER:$APP_USER" "$NGINX_SSL_DIR"
    echo_info "Self-signed SSL certificate generated"
else
    echo_info "Self-signed SSL certificate already exists"
fi

# =============================================================================
# STEP 9: CREATE PRODUCTION .ENV TEMPLATE
# =============================================================================
echo_step "9/9 Creating production environment template..."

cat > "$APP_DIR/.env.production.template" << 'EOF'
# =============================================================================
# PRODUCTION ENVIRONMENT - Science Based Body
# =============================================================================
# Copy to .env and fill in values from .env.secrets + your API keys

NODE_ENV=production
PORT=3001
FRONTEND_URL=https://sbbpeptides.com

# Database (values auto-generated in .env.secrets)
DB_USER=sbb_user
DB_PASSWORD=<from .env.secrets>
DB_NAME=science_based_body

# Redis (value auto-generated in .env.secrets)
REDIS_PASSWORD=<from .env.secrets>

# Security (values auto-generated in .env.secrets)
JWT_SECRET=<from .env.secrets>
JWT_EXPIRATION=24h
JWT_REFRESH_EXPIRATION=7d
ENCRYPTION_KEY=<from .env.secrets>

# CORS - Your frontend domains
CORS_ORIGINS=https://sbbpeptides.com,https://www.sbbpeptides.com,https://sciencebasedbody.com

# SMTP Email (Google Workspace)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<your-google-workspace-email>
SMTP_PASS=<your-google-app-password>
SMTP_FROM_EMAIL=noreply@sciencebasedbody.com
SMTP_FROM_NAME=Science Based Body
ADMIN_EMAIL=sales@sbbpeptides.com

# Mailgun (legacy - leave empty, SMTP is primary)
MAILGUN_API_KEY=
MAILGUN_DOMAIN=

# Payment Methods
PAYMENT_ZELLE_NAME=HEALTH SBB
PAYMENT_ZELLE_PHONE=702-686-5343
PAYMENT_ZELLE_EMAIL=payments@sciencebasedbody.com
PAYMENT_VENMO_USERNAME=@healthsbb
PAYMENT_VENMO_PHONE=702-686-5343
PAYMENT_VENMO_EMAIL=sales@sbbpeptides.com
PAYMENT_CASHAPP_TAG=$ScienceBasedBody

# Epicor Propello (enable when ready)
EPICOR_PROPELLO_ENABLED=false

# Shippo Shipping
SHIPPO_API_KEY=<your-live-shippo-key>
SHIPPO_RETURN_NAME=SBB Health
SHIPPO_RETURN_STREET=<your-warehouse-street>
SHIPPO_RETURN_CITY=Gilbert
SHIPPO_RETURN_STATE=AZ
SHIPPO_RETURN_ZIP=<your-zip>
SHIPPO_RETURN_COUNTRY=US

# TaxJar (Sales Tax)
TAXJAR_API_KEY=<your-live-taxjar-key>
TAXJAR_FROM_STREET=<your-warehouse-street>
TAXJAR_FROM_CITY=Gilbert
TAXJAR_FROM_STATE=AZ
TAXJAR_FROM_ZIP=<your-zip>
TAXJAR_FROM_COUNTRY=US

# Cloudflare R2 (when ready)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=sbb-files

# Compliance
MINIMUM_AGE=18

# Rate limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100
EOF

chown "$APP_USER:$APP_USER" "$APP_DIR/.env.production.template"

# =============================================================================
# SUMMARY
# =============================================================================
echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}     Server Setup Complete!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Generated Files:${NC}"
echo "  $SECRETS_FILE"
echo "  $APP_DIR/.env.production.template"
echo ""
echo -e "${YELLOW}Firewall Status:${NC}"
ufw status | grep -E "22|80|443|51820"
echo ""
echo -e "${YELLOW}WireGuard VPN:${NC}"
if [ -f "$WG_DIR/server_public.key" ]; then
    echo "  Server Public Key: $(cat $WG_DIR/server_public.key)"
    echo "  To start VPN: systemctl enable --now wg-quick@wg0"
fi
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Copy your SSH public key for user '$APP_USER'"
echo "  2. Configure WireGuard client with server public key"
echo "  3. Point DNS to this server: $DOMAIN"
echo "  4. Copy .env.secrets values to .env"
echo "  5. Deploy application: ./scripts/deploy-to-hetzner.sh --build"
echo "  6. Get SSL cert: docker compose exec certbot certbot certonly --webroot -w /var/www/certbot -d $DOMAIN"
echo ""
