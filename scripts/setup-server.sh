#!/bin/bash
# ============================================================
# PrimeTickets — Digital Ocean Droplet Setup Script
# Run as root on a fresh Ubuntu 22.04 Droplet
# Usage: bash setup-server.sh yourdomain.com
# ============================================================
set -e

DOMAIN=${1:-"yourdomain.com"}
APP_DIR="/var/www/primetickets"
REPO="https://github.com/dinnewton/Prime-Tickets-Updated.git"

echo ""
echo "========================================="
echo "  PrimeTickets Server Setup"
echo "  Domain: $DOMAIN"
echo "========================================="
echo ""

# ─── 1. System update ────────────────────────────────────────
echo "[1/9] Updating system..."
apt-get update -qq && apt-get upgrade -y -qq

# ─── 2. Node.js 20 ───────────────────────────────────────────
echo "[2/9] Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null
apt-get install -y nodejs > /dev/null
echo "      Node $(node -v) | npm $(npm -v)"

# ─── 3. PM2, Nginx, Certbot ──────────────────────────────────
echo "[3/9] Installing PM2, Nginx, Certbot..."
npm install -g pm2 --silent
apt-get install -y nginx certbot python3-certbot-nginx > /dev/null

# ─── 4. Firewall ─────────────────────────────────────────────
echo "[4/9] Configuring firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# ─── 5. Clone repo ───────────────────────────────────────────
echo "[5/9] Cloning repository..."
mkdir -p /var/www
if [ -d "$APP_DIR" ]; then
  echo "      Directory exists — pulling latest..."
  cd "$APP_DIR" && git pull
else
  git clone "$REPO" "$APP_DIR"
  cd "$APP_DIR"
fi

# ─── 6. Install dependencies & build ─────────────────────────
echo "[6/9] Installing dependencies and building..."
cd "$APP_DIR"
npm install --silent
cd backend && npm install --silent && cd ..
npm run build
echo "      Build complete."

# ─── 7. Create .env from example ────────────────────────────
echo "[7/9] Setting up environment..."
if [ ! -f "$APP_DIR/backend/.env" ]; then
  cp "$APP_DIR/backend/.env.example" "$APP_DIR/backend/.env"
  # Generate a strong JWT secret automatically
  JWT=$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")
  sed -i "s/REPLACE_WITH_LONG_RANDOM_STRING/$JWT/" "$APP_DIR/backend/.env"
  echo ""
  echo "  ⚠️  IMPORTANT: Edit $APP_DIR/backend/.env"
  echo "      Fill in your M-Pesa credentials and callback URL."
  echo "      Press ENTER to continue when ready (or Ctrl+C to do it first)."
  read -r
fi

# ─── 8. Nginx config ─────────────────────────────────────────
echo "[8/9] Configuring Nginx..."
NGINX_CONF="/etc/nginx/sites-available/primetickets"
cat > "$NGINX_CONF" << NGINX
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    location / {
        proxy_pass         http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade \$http_upgrade;
        proxy_set_header   Connection "upgrade";
        proxy_set_header   Host              \$host;
        proxy_set_header   X-Real-IP         \$remote_addr;
        proxy_set_header   X-Forwarded-For   \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }

    location /uploads/ {
        alias $APP_DIR/backend/uploads/;
        expires 30d;
        add_header Cache-Control "public";
    }
}
NGINX

ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/primetickets
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
echo "      Nginx configured."

# ─── 9. SSL certificate ──────────────────────────────────────
echo "[9/9] Obtaining SSL certificate..."
certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --email "admin@$DOMAIN" --redirect
echo "      HTTPS enabled."

# ─── Start app ───────────────────────────────────────────────
echo ""
echo "Starting PrimeTickets with PM2..."
cd "$APP_DIR"
pm2 delete primetickets 2>/dev/null || true
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup systemd -u root --hp /root | tail -1 | bash

echo ""
echo "========================================="
echo "  ✅ Setup complete!"
echo "  🌐 https://$DOMAIN"
echo ""
echo "  Useful commands:"
echo "    pm2 logs primetickets   — view app logs"
echo "    pm2 restart primetickets — restart app"
echo "    cd $APP_DIR && git pull && npm run build && pm2 restart primetickets"
echo "========================================="
