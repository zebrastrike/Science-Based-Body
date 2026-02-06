#!/bin/bash

# =============================================================================
# SCIENCE BASED BODY - HETZNER DEPLOYMENT SCRIPT (Docker)
# =============================================================================
# Usage: ./scripts/deploy-to-hetzner.sh [--build] [--migrate]
# =============================================================================

set -e

# Configuration
HETZNER_IP="${HETZNER_SERVER_IP:-YOUR_SERVER_IP}"
SSH_USER="${HETZNER_SSH_USER:-sbb}"
SSH_KEY="${HETZNER_SSH_KEY_PATH:-~/.ssh/hetzner_sbb}"
REMOTE_DIR="/opt/science-based-body"
DOMAIN="api.sbbpeptides.com"

# Parse arguments
BUILD_FLAG=""
MIGRATE_FLAG=""
SSL_FLAG=""
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --build) BUILD_FLAG="--build" ;;
        --migrate) MIGRATE_FLAG="true" ;;
        --ssl) SSL_FLAG="true" ;;
        --help)
            echo "Usage: ./scripts/deploy-to-hetzner.sh [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --build    Rebuild Docker containers"
            echo "  --migrate  Run database migrations"
            echo "  --ssl      Request SSL certificate from Let's Encrypt"
            echo "  --help     Show this help message"
            exit 0
            ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
echo_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
echo_error() { echo -e "${RED}[ERROR]${NC} $1"; }
echo_step() { echo -e "\n${BLUE}▸ $1${NC}"; }

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Science Based Body - Production Deployment${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
echo ""
echo -e "Server:  ${YELLOW}$SSH_USER@$HETZNER_IP${NC}"
echo -e "Path:    ${YELLOW}$REMOTE_DIR${NC}"
echo -e "Domain:  ${YELLOW}$DOMAIN${NC}"
echo ""

# Check if SSH key exists
if [ ! -f "$SSH_KEY" ] && [ ! -f "${SSH_KEY/#\~/$HOME}" ]; then
    echo_error "SSH key not found at $SSH_KEY"
    echo "Set HETZNER_SSH_KEY_PATH environment variable"
    exit 1
fi

# Expand tilde in SSH_KEY path
SSH_KEY="${SSH_KEY/#\~/$HOME}"

# Function to run remote commands
run_remote() {
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=accept-new "$SSH_USER@$HETZNER_IP" "$1"
}

# Function to copy files
copy_to_remote() {
    scp -i "$SSH_KEY" -r "$1" "$SSH_USER@$HETZNER_IP:$2"
}

# =============================================================================
# Pre-flight checks
# =============================================================================
echo_step "Running pre-flight checks..."

# Check SSH connection
if ! run_remote "echo 'connected'" > /dev/null 2>&1; then
    echo_error "Cannot connect to server. Check SSH configuration."
    exit 1
fi
echo_info "SSH connection OK"

# Check if .env exists locally (we don't sync it, but warn if missing on server)
if [ ! -f ".env" ] && [ ! -f ".env.production" ]; then
    echo_warn "No .env file found locally - ensure server has .env configured"
fi

# =============================================================================
# Sync files
# =============================================================================
echo_step "Syncing files to server..."

rsync -avz --progress \
    -e "ssh -i $SSH_KEY" \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '.env' \
    --exclude '.env.local' \
    --exclude '.env.production' \
    --exclude 'dist' \
    --exclude '.next' \
    --exclude '*.log' \
    --exclude 'backups/*' \
    --exclude 'apps/web' \
    --delete \
    ./ "$SSH_USER@$HETZNER_IP:$REMOTE_DIR/"

echo_info "Files synced"

# =============================================================================
# Run migrations (if requested)
# =============================================================================
if [ "$MIGRATE_FLAG" = "true" ]; then
    echo_step "Running database migrations..."
    run_remote "cd $REMOTE_DIR && docker compose exec -T api npx prisma migrate deploy"
    echo_info "Migrations complete"
fi

# =============================================================================
# Build and deploy
# =============================================================================
echo_step "Deploying with Docker Compose..."

if [ -n "$BUILD_FLAG" ]; then
    echo_info "Building containers (this may take a few minutes)..."
    run_remote "cd $REMOTE_DIR && docker compose build --no-cache api"
fi

# Pull latest images and restart
run_remote "cd $REMOTE_DIR && docker compose pull postgres redis nginx"
run_remote "cd $REMOTE_DIR && docker compose up -d $BUILD_FLAG"

echo_info "Containers started"

# =============================================================================
# Health check
# =============================================================================
echo_step "Running health checks..."

# Wait for API to start
echo_info "Waiting for API to be ready..."
sleep 10

# Check container status
echo ""
run_remote "cd $REMOTE_DIR && docker compose ps"
echo ""

# Test health endpoint
HEALTH_STATUS=$(run_remote "curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/api/v1/health" || echo "000")

if [ "$HEALTH_STATUS" = "200" ]; then
    echo_info "Health check passed (HTTP $HEALTH_STATUS)"
else
    echo_warn "Health check returned HTTP $HEALTH_STATUS"
    echo_warn "Check logs: docker compose logs api"
fi

# =============================================================================
# SSL Certificate (if requested)
# =============================================================================
if [ "$SSL_FLAG" = "true" ]; then
    echo_step "Requesting SSL certificate from Let's Encrypt..."

    # Request certificate
    run_remote "cd $REMOTE_DIR && docker compose run --rm certbot certbot certonly --webroot -w /var/www/certbot -d $DOMAIN --non-interactive --agree-tos --email admin@sciencebasedbody.com"

    # Reload nginx to pick up new certs
    run_remote "cd $REMOTE_DIR && docker compose exec nginx nginx -s reload"

    echo_info "SSL certificate obtained and nginx reloaded"
fi

# =============================================================================
# Summary
# =============================================================================
echo ""
echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
echo ""
echo "API Endpoints:"
echo "  Internal:  http://localhost:3001/api/v1"
echo "  Public:    https://$DOMAIN/api/v1"
echo ""
echo "Useful commands (run on server):"
echo "  View logs:     docker compose logs -f api"
echo "  Restart:       docker compose restart api"
echo "  Shell:         docker compose exec api sh"
echo "  DB console:    docker compose exec postgres psql -U sbb_user science_based_body"
echo ""
echo "First-time deployment:"
echo "  1. Run setup:  bash scripts/setup-hetzner.sh"
echo "  2. Copy .env:  cp .env.production.template .env && vim .env"
echo "  3. Deploy:     ./scripts/deploy-to-hetzner.sh --build --migrate"
echo "  4. Get SSL:    ./scripts/deploy-to-hetzner.sh --ssl"
echo ""
