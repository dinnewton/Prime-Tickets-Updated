#!/bin/bash
# ============================================================
# PrimeTickets — Copy live data from the old server to this one
# Run as root on the NEW server, from inside the cloned repo.
#
# Copies: backend/.env, backend/db/data.json, backend/uploads/
# (none of these are in git, so they only exist on the old server)
#
# Usage:
#   bash scripts/migrate-from-server.sh OLD_SERVER_IP            # copy only (old site keeps running)
#   bash scripts/migrate-from-server.sh OLD_SERVER_IP --final    # stop old app first, then copy
#
# Use --final at cutover so no bookings are made on the old server
# after the copy. You will be asked for the old server's root password.
# ============================================================
set -e

OLD_HOST=${1:?Usage: bash scripts/migrate-from-server.sh OLD_SERVER_IP [--final]}
FINAL=${2:-}
APP_DIR="/var/www/primetickets"
REMOTE="root@$OLD_HOST"
SOCKET="/tmp/pt-migrate-$$"

cd "$APP_DIR"

# One SSH connection, reused for every step, so the password is asked once.
ssh -o StrictHostKeyChecking=accept-new -o ControlMaster=yes -o ControlPath="$SOCKET" -o ControlPersist=120 -Nf "$REMOTE"
trap 'ssh -o ControlPath="$SOCKET" -O exit "$REMOTE" 2>/dev/null || true' EXIT
SSH="ssh -o ControlPath=$SOCKET"

if [ "$FINAL" = "--final" ]; then
  echo "Stopping the app on $OLD_HOST so no new data is written..."
  $SSH "$REMOTE" "pm2 stop primetickets" || true
fi

echo "Copying backend/.env..."
# Keep this server's port: it may differ from the old server's (shared host).
LOCAL_PORT=$(grep -s '^PORT=' backend/.env | cut -d= -f2)
scp -o ControlPath="$SOCKET" "$REMOTE:$APP_DIR/backend/.env" backend/.env
if [ -n "$LOCAL_PORT" ]; then
  if grep -q '^PORT=' backend/.env; then
    sed -i "s/^PORT=.*/PORT=$LOCAL_PORT/" backend/.env
  else
    echo "PORT=$LOCAL_PORT" >> backend/.env
  fi
fi

echo "Copying backend/db/data.json..."
if [ -f backend/db/data.json ]; then
  cp backend/db/data.json "backend/db/data.json.bak-$(date +%Y%m%d-%H%M%S)"
fi
scp -o ControlPath="$SOCKET" "$REMOTE:$APP_DIR/backend/db/data.json" backend/db/data.json

echo "Copying backend/uploads/..."
mkdir -p backend/uploads
scp -r -o ControlPath="$SOCKET" "$REMOTE:$APP_DIR/backend/uploads/." backend/uploads/

echo ""
echo "Done. Copied from $OLD_HOST:"
ls -la backend/.env backend/db/data.json
echo "Uploads: $(find backend/uploads -type f | wc -l) files"

if pm2 describe primetickets > /dev/null 2>&1; then
  pm2 restart primetickets
  echo "Restarted primetickets on this server."
fi
