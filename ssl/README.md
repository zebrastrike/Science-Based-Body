# SSL/TLS Certificates

This directory contains SSL/TLS certificate configuration for Science Based Body.

## Production Certificates (Let's Encrypt)

For production, we use Let's Encrypt certificates managed by Certbot.

### Initial Setup

1. SSH into your Hetzner server
2. Run the SSL setup script:
   ```bash
   ./scripts/setup-ssl.sh sciencebasedbody.com
   ```

### Certificate Locations

After setup, certificates are stored at:
- Certificate: `/etc/letsencrypt/live/sciencebasedbody.com/fullchain.pem`
- Private Key: `/etc/letsencrypt/live/sciencebasedbody.com/privkey.pem`

### Auto-Renewal

Certbot automatically renews certificates via systemd timer. Check status:
```bash
systemctl status certbot.timer
```

### Manual Renewal

If needed, manually renew:
```bash
certbot renew
```

## Development Certificates

For local development with HTTPS, generate self-signed certificates:

```bash
# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/dev-key.pem \
  -out ssl/dev-cert.pem \
  -subj "/CN=localhost"
```

**Note:** Self-signed certificates will show browser warnings. This is expected for development.

## Cloudflare SSL

If using Cloudflare in front of Hetzner:

1. Set SSL/TLS mode to "Full (strict)" in Cloudflare dashboard
2. Cloudflare will handle client-facing SSL
3. Origin server (Hetzner) still needs valid certificate for Cloudflare connection

## Security Best Practices

1. **Never commit private keys** to version control
2. Use strong SSL configuration (TLS 1.2+)
3. Enable HSTS headers
4. Regular certificate rotation
5. Monitor certificate expiration

## Testing SSL Configuration

Test your SSL configuration:
```bash
# Online test
# https://www.ssllabs.com/ssltest/

# Local test
openssl s_client -connect sciencebasedbody.com:443 -servername sciencebasedbody.com
```
