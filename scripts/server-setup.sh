#!/bin/bash
set -e

# =============================================================================
# Science Based Body - Hetzner Server Setup Script
# Run this on a fresh Ubuntu 24.04 server
# Usage: curl -sSL https://raw.githubusercontent.com/.../server-setup.sh | bash
# =============================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
echo_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
echo_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo_error "Please run as root (use sudo)"
    exit 1
fi

# Configuration
APP_USER="sbb"
APP_DIR="/opt/science-based-body"
DOMAIN="api.sciencebasedbody.com"

echo_info "Starting Science Based Body server setup..."

# =============================================================================
# 1. System Updates
# =============================================================================
echo_info "Updating system packages..."
apt-get update && apt-get upgrade -y

# =============================================================================
# 2. Install Essential Packages
# =============================================================================
echo_info "Installing essential packages..."
apt-get install -y \
    curl \
    wget \
    git \
    unzip \
    htop \
    ncdu \
    vim \
    ufw \
    fail2ban \
    logrotate \
    ca-certificates \
    gnupg \
    lsb-release

# =============================================================================
# 3. Create Application User
# =============================================================================
echo_info "Creating application user..."
if ! id "$APP_USER" &>/dev/null; then
    useradd -m -s /bin/bash "$APP_USER"
    usermod -aG sudo "$APP_USER"
    echo_info "User $APP_USER created"
else
    echo_warn "User $APP_USER already exists"
fi

# =============================================================================
# 4. Install Docker
# =============================================================================
echo_info "Installing Docker..."
if ! command -v docker &> /dev/null; then
    # Add Docker's official GPG key
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg

    # Add the repository
    echo \
        "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
        $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
        tee /etc/apt/sources.list.d/docker.list > /dev/null

    # Install Docker
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    # Add user to docker group
    usermod -aG docker "$APP_USER"

    # Enable and start Docker
    systemctl enable docker
    systemctl start docker

    echo_info "Docker installed successfully"
else
    echo_warn "Docker already installed"
fi

# =============================================================================
# 5. Configure Firewall (UFW)
# =============================================================================
echo_info "Configuring firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing

# SSH (change port if you use non-standard)
ufw allow 22/tcp comment 'SSH'

# HTTP/HTTPS
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'

# Enable firewall
ufw --force enable
echo_info "Firewall configured"

# =============================================================================
# 6. Configure Fail2ban
# =============================================================================
echo_info "Configuring Fail2ban..."
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5
backend = systemd

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
echo_info "Fail2ban configured"

# =============================================================================
# 7. SSH Hardening
# =============================================================================
echo_info "Hardening SSH configuration..."
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak

cat > /etc/ssh/sshd_config.d/hardening.conf << 'EOF'
# Disable password authentication (ensure you have SSH key setup first!)
# Uncomment the line below after confirming SSH key access works
# PasswordAuthentication no

# Disable root login
PermitRootLogin prohibit-password

# Disable empty passwords
PermitEmptyPasswords no

# Use only SSH protocol 2
Protocol 2

# Limit authentication attempts
MaxAuthTries 3

# Disable X11 forwarding
X11Forwarding no

# Set idle timeout
ClientAliveInterval 300
ClientAliveCountMax 2
EOF

# Don't restart SSH yet - user needs to verify key access first
echo_warn "SSH hardening configured. Verify SSH key access, then run: systemctl restart sshd"

# =============================================================================
# 8. Create Application Directory
# =============================================================================
echo_info "Creating application directory..."
mkdir -p "$APP_DIR"
mkdir -p "$APP_DIR/nginx/conf.d"
mkdir -p "$APP_DIR/nginx/ssl"
mkdir -p "$APP_DIR/scripts"
mkdir -p "$APP_DIR/backups"
chown -R "$APP_USER:$APP_USER" "$APP_DIR"

# =============================================================================
# 9. Generate Self-Signed SSL (Placeholder for Let's Encrypt)
# =============================================================================
echo_info "Generating placeholder SSL certificate..."
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "$APP_DIR/nginx/ssl/default.key" \
    -out "$APP_DIR/nginx/ssl/default.crt" \
    -subj "/CN=localhost" 2>/dev/null

# =============================================================================
# 10. Create Systemd Service for Docker Compose
# =============================================================================
echo_info "Creating systemd service..."
cat > /etc/systemd/system/sbb.service << EOF
[Unit]
Description=Science Based Body Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
User=$APP_USER
Group=$APP_USER

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable sbb.service
echo_info "Systemd service created"

# =============================================================================
# 11. Setup Log Rotation
# =============================================================================
echo_info "Configuring log rotation..."
cat > /etc/logrotate.d/sbb << 'EOF'
/opt/science-based-body/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 sbb sbb
    sharedscripts
    postrotate
        docker kill -s USR1 sbb-nginx 2>/dev/null || true
    endscript
}
EOF

# =============================================================================
# 12. Setup Automatic Security Updates
# =============================================================================
echo_info "Configuring automatic security updates..."
apt-get install -y unattended-upgrades
cat > /etc/apt/apt.conf.d/50unattended-upgrades << 'EOF'
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}";
    "${distro_id}:${distro_codename}-security";
    "${distro_id}ESMApps:${distro_codename}-apps-security";
    "${distro_id}ESM:${distro_codename}-infra-security";
};
Unattended-Upgrade::Remove-Unused-Kernel-Packages "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
EOF

# =============================================================================
# 13. Set System Limits
# =============================================================================
echo_info "Configuring system limits..."
cat >> /etc/security/limits.conf << 'EOF'

# Science Based Body limits
sbb soft nofile 65535
sbb hard nofile 65535
sbb soft nproc 65535
sbb hard nproc 65535
EOF

# =============================================================================
# 14. Create Helper Scripts
# =============================================================================
echo_info "Creating helper scripts..."

# Backup script
cat > "$APP_DIR/scripts/backup-db.sh" << 'EOF'
#!/bin/bash
set -e
BACKUP_DIR="/opt/science-based-body/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/sbb_backup_$TIMESTAMP.sql.gz"

# Load environment
source /opt/science-based-body/.env

docker exec sbb-postgres pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"

# Keep only last 7 days of backups
find "$BACKUP_DIR" -name "sbb_backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE"
EOF
chmod +x "$APP_DIR/scripts/backup-db.sh"

# SSL renewal check
cat > "$APP_DIR/scripts/check-ssl.sh" << 'EOF'
#!/bin/bash
# Check SSL certificate expiry
DOMAIN="api.sciencebasedbody.com"
EXPIRY=$(echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN":443 2>/dev/null | openssl x509 -noout -dates 2>/dev/null | grep notAfter | cut -d= -f2)
echo "SSL certificate for $DOMAIN expires: $EXPIRY"
EOF
chmod +x "$APP_DIR/scripts/check-ssl.sh"

chown -R "$APP_USER:$APP_USER" "$APP_DIR"

# =============================================================================
# 15. Add Cron Jobs
# =============================================================================
echo_info "Setting up cron jobs..."
(crontab -u "$APP_USER" -l 2>/dev/null || true; cat << 'EOF'
# Daily database backup at 3 AM
0 3 * * * /opt/science-based-body/scripts/backup-db.sh >> /opt/science-based-body/backups/backup.log 2>&1

# Weekly SSL check on Sundays at 4 AM
0 4 * * 0 /opt/science-based-body/scripts/check-ssl.sh >> /opt/science-based-body/backups/ssl-check.log 2>&1

# Docker system prune weekly on Saturdays at 2 AM
0 2 * * 6 docker system prune -af >> /opt/science-based-body/backups/docker-prune.log 2>&1
EOF
) | crontab -u "$APP_USER" -

# =============================================================================
# Summary
# =============================================================================
echo ""
echo "=============================================="
echo_info "Server setup complete!"
echo "=============================================="
echo ""
echo "Next steps:"
echo "  1. Copy your application files to: $APP_DIR"
echo "  2. Create .env file with your secrets"
echo "  3. Run SSL setup: ./scripts/setup-ssl.sh"
echo "  4. Start the application: systemctl start sbb"
echo ""
echo "Important paths:"
echo "  Application: $APP_DIR"
echo "  Backups:     $APP_DIR/backups"
echo "  Logs:        docker logs sbb-api"
echo ""
echo "Commands:"
echo "  Start:   systemctl start sbb"
echo "  Stop:    systemctl stop sbb"
echo "  Status:  systemctl status sbb"
echo "  Logs:    docker compose logs -f"
echo ""
echo_warn "Remember to:"
echo "  - Set up SSH keys before disabling password auth"
echo "  - Create your .env file with all required secrets"
echo "  - Point DNS for $DOMAIN to this server's IP"
echo ""
