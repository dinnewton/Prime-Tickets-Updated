#!/bin/bash
# ============================================================
# PrimeTickets — Read-only survey of a server before setup.
# Changes nothing. Run as root and share the output.
#
# Usage (no clone needed):
#   curl -fsSL https://raw.githubusercontent.com/dinnewton/Prime-Tickets-Updated/master/scripts/check-server.sh | bash
# ============================================================

section() { echo ""; echo "=== $1 ==="; }

section "OS"
. /etc/os-release 2>/dev/null && echo "$PRETTY_NAME"
echo "RAM: $(free -h | awk '/Mem:/ {print $2 " total, " $7 " available"}')"
echo "Disk: $(df -h / | awk 'NR==2 {print $4 " free of " $2}')"

section "Listening ports"
ss -ltnp | awk 'NR==1 || /LISTEN/' | awk '{print $4, $6}' | sort -u

section "Web server"
for s in nginx apache2 caddy; do
  if command -v $s > /dev/null || systemctl list-unit-files | grep -q "^$s"; then
    echo "$s: $(systemctl is-active $s 2>/dev/null)"
  fi
done

section "Nginx sites"
if [ -d /etc/nginx/sites-enabled ]; then
  for f in /etc/nginx/sites-enabled/*; do
    echo "$(basename "$f"):"
    grep -hE '^\s*(listen|server_name|proxy_pass|root)\b' "$f" | sed 's/^\s*/    /'
  done
fi
ls /etc/nginx/conf.d/*.conf 2>/dev/null

section "Node / PM2"
command -v node > /dev/null && echo "node $(node -v)" || echo "node: not installed"
command -v pm2 > /dev/null && pm2 list || echo "pm2: not installed"

section "Other runtimes"
command -v php > /dev/null && php -v | head -1
command -v docker > /dev/null && docker ps --format '{{.Names}}  {{.Ports}}'

section "Firewall"
ufw status 2>/dev/null || echo "ufw not installed"

section "Certificates"
command -v certbot > /dev/null && certbot certificates 2>/dev/null | grep -E 'Certificate Name|Domains|Expiry' || echo "certbot not installed"

section "/var/www"
ls -la /var/www 2>/dev/null
