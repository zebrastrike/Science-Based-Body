#!/bin/bash

# =============================================================================
# WIREGUARD CLIENT CONFIG GENERATOR
# =============================================================================
# Run on the server after setup to generate client configurations
# Usage: bash generate-wireguard-client.sh <client-name> <client-ip-suffix>
# Example: bash generate-wireguard-client.sh laptop 2
# =============================================================================

set -e

if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <client-name> <client-ip-suffix>"
    echo "Example: $0 laptop 2"
    echo ""
    echo "This will create a client with IP 10.0.0.<suffix>"
    exit 1
fi

CLIENT_NAME="$1"
CLIENT_IP_SUFFIX="$2"
WG_DIR="/etc/wireguard"
CLIENT_DIR="$WG_DIR/clients"
SERVER_IP=$(curl -s ifconfig.me)

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root (sudo)"
    exit 1
fi

# Create clients directory
mkdir -p "$CLIENT_DIR"

# Generate client keys
CLIENT_PRIVATE=$(wg genkey)
CLIENT_PUBLIC=$(echo "$CLIENT_PRIVATE" | wg pubkey)
SERVER_PUBLIC=$(cat "$WG_DIR/server_public.key")

# Create client config file
CLIENT_CONFIG="$CLIENT_DIR/${CLIENT_NAME}.conf"
cat > "$CLIENT_CONFIG" << EOF
# WireGuard Client Config - $CLIENT_NAME
# Generated: $(date)

[Interface]
PrivateKey = $CLIENT_PRIVATE
Address = 10.0.0.${CLIENT_IP_SUFFIX}/32
DNS = 1.1.1.1, 8.8.8.8

[Peer]
PublicKey = $SERVER_PUBLIC
AllowedIPs = 10.0.0.0/24
Endpoint = ${SERVER_IP}:51820
PersistentKeepalive = 25
EOF

chmod 600 "$CLIENT_CONFIG"

# Add peer to server config
cat >> "$WG_DIR/wg0.conf" << EOF

# Client: $CLIENT_NAME (added $(date +%Y-%m-%d))
[Peer]
PublicKey = $CLIENT_PUBLIC
AllowedIPs = 10.0.0.${CLIENT_IP_SUFFIX}/32
EOF

echo ""
echo "==========================================="
echo "  WireGuard Client Created: $CLIENT_NAME"
echo "==========================================="
echo ""
echo "Client IP: 10.0.0.${CLIENT_IP_SUFFIX}"
echo "Config file: $CLIENT_CONFIG"
echo ""
echo "To apply changes, restart WireGuard:"
echo "  systemctl restart wg-quick@wg0"
echo ""
echo "Transfer the config file to your device:"
echo "  scp root@${SERVER_IP}:${CLIENT_CONFIG} ./"
echo ""
echo "Or scan this QR code (if qrencode is installed):"
if command -v qrencode &> /dev/null; then
    qrencode -t ansiutf8 < "$CLIENT_CONFIG"
else
    echo "  apt-get install qrencode && qrencode -t ansiutf8 < $CLIENT_CONFIG"
fi
