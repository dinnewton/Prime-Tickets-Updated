#!/bin/bash
# Run this ONCE on the Digital Ocean droplet to get a free Let's Encrypt cert
# and switch Cloudflare to Full SSL (not Flexible).
#
# Prerequisites:
#   - Nginx already running and serving the site on port 80
#   - DNS is pointing to this server (primeticketsoko.com resolves here)
#
# Usage:
#   ssh root@188.166.155.26
#   bash /var/www/primetickets/scripts/setup-ssl.sh

set -e

DOMAIN="primeticketsoko.com"

echo "Installing certbot..."
apt-get update -qq
apt-get install -y certbot python3-certbot-nginx

echo "Obtaining certificate for $DOMAIN and www.$DOMAIN..."
certbot --nginx \
  -d "$DOMAIN" \
  -d "www.$DOMAIN" \
  --non-interactive \
  --agree-tos \
  --email dinnewton76@gmail.com \
  --redirect

echo "Enabling auto-renewal..."
systemctl enable certbot.timer
systemctl start certbot.timer

echo ""
echo "Done! SSL is now active."
echo "IMPORTANT: In Cloudflare dashboard, change SSL/TLS mode from 'Flexible' to 'Full (strict)'."
echo "This prevents unencrypted traffic between Cloudflare and your server."
