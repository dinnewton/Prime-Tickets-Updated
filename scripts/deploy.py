"""
Remote deployment script -- uploads a bash script via SFTP then executes it.
"""
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

import paramiko
import time

HOST     = "188.166.155.26"
PORT     = 22
USER     = "root"
PASSWORD = "Prime@Tickets01N"
APP_DIR  = "/var/www/primetickets"

# The deployment script that runs on the server
DEPLOY_SCRIPT = r"""#!/bin/bash
set -e
APP_DIR="/var/www/primetickets"

echo "[1] Setting up .env file..."
cd "$APP_DIR"
if [ ! -f backend/.env ]; then
  cp backend/.env.example backend/.env
fi

# Generate JWT secret
JWT=$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")
sed -i "s/REPLACE_WITH_LONG_RANDOM_STRING/$JWT/" backend/.env
echo "    JWT secret written"

# Show non-sensitive env keys
grep -E "^(PORT|NODE_ENV|MPESA_ENV|MPESA_SHORTCODE)" backend/.env || true

echo "[2] Creating uploads directory..."
mkdir -p "$APP_DIR/backend/uploads/events"
chmod 755 "$APP_DIR/backend/uploads/events"
echo "    Done"

echo "[3] Configuring Nginx..."
cat > /etc/nginx/sites-available/primetickets << 'NGINXEOF'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass         http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection "upgrade";
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    location /uploads/ {
        alias /var/www/primetickets/backend/uploads/;
        expires 30d;
        add_header Cache-Control "public";
    }
}
NGINXEOF

ln -sf /etc/nginx/sites-available/primetickets /etc/nginx/sites-enabled/primetickets
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
echo "    Nginx configured and reloaded"

echo "[4] Starting app with PM2..."
cd "$APP_DIR"
pm2 delete primetickets 2>/dev/null || true
pm2 start ecosystem.config.cjs --env production
pm2 save
# Register PM2 to auto-start on reboot
env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u root --hp /root > /dev/null 2>&1 || true
systemctl enable pm2-root 2>/dev/null || true

echo "[5] Waiting for app to start..."
sleep 4

echo "[6] Health check..."
HEALTH=$(curl -s http://localhost:5000/api/health)
echo "    $HEALTH"

echo ""
echo "============================================"
echo "  Deployment complete!"
echo "  Site: http://188.166.155.26"
echo "============================================"
"""


def run(client, label, command, timeout=180):
    print(f"\n  >> {label}")
    stdin, stdout, stderr = client.exec_command(command, timeout=timeout, get_pty=True)
    while True:
        line = stdout.readline()
        if not line:
            break
        print(f"     {line.rstrip()}")
    code = stdout.channel.recv_exit_status()
    if code != 0:
        err = stderr.read().decode(errors='replace').strip()
        if err:
            print(f"     STDERR: {err}")
        print(f"  FAILED (exit {code})")
        return False
    print(f"  OK")
    return True


def deploy():
    print("=" * 55)
    print("  PrimeTickets -- Digital Ocean Deployment")
    print(f"  {HOST}")
    print("=" * 55)

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    print(f"\nConnecting to {HOST}...")
    try:
        client.connect(HOST, port=PORT, username=USER, password=PASSWORD, timeout=30)
        print("  Connected\n")
    except Exception as e:
        print(f"  Connection failed: {e}")
        sys.exit(1)

    # Upload the deploy script via SFTP
    print("  Uploading deploy script...")
    sftp = client.open_sftp()
    with sftp.open('/root/deploy_primetickets.sh', 'w') as f:
        f.write(DEPLOY_SCRIPT)
    sftp.chmod('/root/deploy_primetickets.sh', 0o755)
    sftp.close()
    print("  Script uploaded\n")

    # Run it
    ok = run(client, "Running deployment script", "bash /root/deploy_primetickets.sh", timeout=300)

    if not ok:
        print("\n  Deployment failed. Check output above.")
    else:
        print("\n" + "=" * 55)
        print("  Site is LIVE at: http://188.166.155.26")
        print()
        print("  Next steps:")
        print("  1. Visit http://188.166.155.26 to confirm")
        print(f"  2. Add M-Pesa credentials:")
        print(f"     ssh root@{HOST}")
        print(f"     nano {APP_DIR}/backend/.env")
        print(f"     pm2 restart primetickets")
        print()
        print("  3. Add a domain + free SSL:")
        print("     Point your domain A record -> 188.166.155.26")
        print("     Then: certbot --nginx -d yourdomain.com")
        print("=" * 55)

    client.close()


if __name__ == "__main__":
    deploy()
