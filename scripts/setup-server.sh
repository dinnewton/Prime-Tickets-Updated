#!/bin/bash
# ============================================================
# PrimeTickets — Server Setup Script (Contabo, Digital Ocean, any VPS)
# Run as root on Ubuntu 22.04 / 24.04. Safe on a server that already
# hosts other projects: it never upgrades system packages, replaces
# Node, removes other nginx sites or enables the firewall.
#
# Usage: bash setup-server.sh yourdomain.com [--no-ssl]
#   --no-ssl  skip the certificate step (use when DNS does not point
#             here yet; run scripts/setup-ssl.sh after switching DNS)
#
# The app port defaults to 5000. If another project uses it:
#   APP_PORT=5100 bash setup-server.sh yourdomain.com --no-ssl
# Run scripts/check-server.sh first to see what is already in use.
# ============================================================
set -e

DOMAIN=${1:-"yourdomain.com"}
NO_SSL=${2:-}
APP_PORT=${APP_PORT:-5000}
APP_DIR="/var/www/primetickets"
REPO="https://github.com/dinnewton/Prime-Tickets-Updated.git"

echo ""
echo "========================================="
echo "  PrimeTickets Server Setup"
echo "  Domain: $DOMAIN   Port: $APP_PORT"
echo "========================================="
echo ""

# ─── 1. Pre-flight checks (stop before changing anything) ────
echo "[1/9] Checking the server..."
if ss -ltnp | grep -E ':80\s' | grep -q apache2; then
  echo "  ✗ Apache is serving port 80. This script uses nginx and would clash."
  echo "    Send the output of scripts/check-server.sh so the setup can be adapted."
  exit 1
fi
if ss -ltnp | grep -E ":$APP_PORT\s" > /dev/null; then
  if ! pm2 describe primetickets > /dev/null 2>&1; then
    echo "  ✗ Port $APP_PORT is already used by another program:"
    ss -ltnp | grep -E ":$APP_PORT\s"
    echo "    Pick a free port, e.g.: APP_PORT=5100 bash $0 $DOMAIN $NO_SSL"
    exit 1
  fi
fi
if grep -rlsE "server_name[^;]*\b$DOMAIN\b" /etc/nginx/sites-enabled/ | grep -v '/primetickets$'; then
  echo "  ✗ Another nginx site above already uses $DOMAIN. Remove it from there first."
  exit 1
fi
echo "      OK"

# ─── 2. Node.js (keep existing if 18+) ───────────────────────
echo "[2/9] Checking Node.js..."
apt-get update -qq
if command -v node > /dev/null; then
  NODE_MAJOR=$(node -p 'process.versions.node.split(".")[0]')
  if [ "$NODE_MAJOR" -lt 18 ]; then
    echo "  ✗ Node $(node -v) is installed and too old (need 18+)."
    echo "    Replacing it could break the other projects, so stopping here."
    exit 1
  fi
  echo "      Using existing Node $(node -v)"
else
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null
  apt-get install -y nodejs > /dev/null
  echo "      Installed Node $(node -v)"
fi

# ─── 3. PM2, Nginx, Certbot (only what is missing) ───────────
echo "[3/9] Checking PM2, Nginx, Certbot..."
command -v pm2 > /dev/null || npm install -g pm2 --silent
command -v nginx > /dev/null || apt-get install -y nginx > /dev/null
command -v certbot > /dev/null || apt-get install -y certbot python3-certbot-nginx > /dev/null
dpkg -s python3-certbot-nginx > /dev/null 2>&1 || apt-get install -y python3-certbot-nginx > /dev/null
echo "      pm2 $(pm2 -v) | $(nginx -v 2>&1)"

# ─── 4. Firewall (add rules only, never enable/reset) ────────
echo "[4/9] Checking firewall..."
if ufw status 2>/dev/null | grep -q "Status: active"; then
  ufw allow 80/tcp > /dev/null
  ufw allow 443/tcp > /dev/null
  echo "      ufw active — ensured ports 80 and 443 are open"
else
  echo "      ufw not active — left unchanged"
fi

# ─── 5. Clone repo ───────────────────────────────────────────
echo "[5/9] Cloning repository..."
mkdir -p /var/www
if [ -d "$APP_DIR/.git" ]; then
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

# ─── 7. Environment ──────────────────────────────────────────
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
  read -r || true   # no terminal (e.g. run over ssh): continue
fi
if grep -q '^PORT=' "$APP_DIR/backend/.env"; then
  sed -i "s/^PORT=.*/PORT=$APP_PORT/" "$APP_DIR/backend/.env"
else
  echo "PORT=$APP_PORT" >> "$APP_DIR/backend/.env"
fi

# ─── 8. Nginx site (own file only) ───────────────────────────
echo "[8/9] Configuring Nginx..."
NGINX_CONF="/etc/nginx/sites-available/primetickets"
cat > "$NGINX_CONF" << NGINX
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    location / {
        proxy_pass         http://127.0.0.1:$APP_PORT;
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
if ! nginx -t; then
  rm -f /etc/nginx/sites-enabled/primetickets
  echo "  ✗ nginx config test failed — removed the PrimeTickets site, other sites untouched."
  exit 1
fi
systemctl reload nginx
echo "      Nginx configured."

# ─── 9. SSL certificate ──────────────────────────────────────
if [ "$NO_SSL" = "--no-ssl" ]; then
  echo "[9/9] Skipping SSL (--no-ssl). Run scripts/setup-ssl.sh once DNS points here."
else
  echo "[9/9] Obtaining SSL certificate..."
  certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --email "admin@$DOMAIN" --redirect
  echo "      HTTPS enabled."
fi

# ─── Start app ───────────────────────────────────────────────
echo ""
echo "Starting PrimeTickets with PM2..."
cd "$APP_DIR"
pm2 delete primetickets 2>/dev/null || true
pm2 start ecosystem.config.cjs --env production
pm2 save
systemctl is-enabled pm2-root > /dev/null 2>&1 || pm2 startup systemd -u root --hp /root > /dev/null

echo ""
echo "========================================="
echo "  ✅ Setup complete!"
echo "  🌐 http://$DOMAIN  (app on 127.0.0.1:$APP_PORT)"
echo ""
echo "  Useful commands:"
echo "    pm2 logs primetickets   — view app logs"
echo "    pm2 restart primetickets — restart app"
echo "    cd $APP_DIR && git pull && npm run build && pm2 restart primetickets"
echo "========================================="
