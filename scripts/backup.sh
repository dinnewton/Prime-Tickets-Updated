#!/bin/bash
# ============================================================
# PrimeTickets — nightly backup of everything not in git:
#   backend/db/data.json, backend/uploads/, backend/.env
# One .tar.gz per run in $BACKUP_DIR, kept for $KEEP_DAYS days.
#
# Installed by scripts/install-backup.sh as /etc/cron.d/primetickets-backup
# Run by hand:   bash /var/www/primetickets/scripts/backup.sh
# Restore:       see the "Restore" comment at the bottom
# ============================================================
set -euo pipefail

APP_DIR="/var/www/primetickets"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/primetickets}"
KEEP_DAYS="${KEEP_DAYS:-14}"
STAMP=$(date +%Y%m%d-%H%M%S)
WORK=$(mktemp -d)
ARCHIVE="$BACKUP_DIR/primetickets-$STAMP.tar.gz"
# Build under .part and rename only when complete, so a failed run never
# leaves a broken archive that looks like a good backup.
trap 'rm -rf "$WORK" "$ARCHIVE.part"' EXIT

mkdir -p "$BACKUP_DIR" "$APP_DIR/backend/uploads"
chmod 700 "$BACKUP_DIR"   # archives contain customer data and secrets

# The app writes data.json atomically (tmp file + rename), so a plain copy
# is always a complete file. Refuse to keep a copy that is not valid JSON.
cp "$APP_DIR/backend/db/data.json" "$WORK/data.json"
node -e "JSON.parse(require('fs').readFileSync('$WORK/data.json','utf8'))" \
  || { echo "$(date -Iseconds) ERROR: data.json is not valid JSON — backup aborted" >&2; exit 1; }
cp "$APP_DIR/backend/.env" "$WORK/env"

tar -czf "$ARCHIVE.part" \
  -C "$WORK" data.json env \
  -C "$APP_DIR/backend" uploads
tar -tzf "$ARCHIVE.part" > /dev/null   # archive is readable
chmod 600 "$ARCHIVE.part"
mv "$ARCHIVE.part" "$ARCHIVE"

find "$BACKUP_DIR" -name 'primetickets-*.tar.gz' -mtime +"$KEEP_DAYS" -delete

echo "$(date -Iseconds) backup ok: $ARCHIVE ($(du -h "$ARCHIVE" | cut -f1)), $(ls "$BACKUP_DIR" | wc -l) kept"

# Restore (on the server, as root):
#   pm2 stop primetickets
#   mkdir /tmp/r && tar -xzf /var/backups/primetickets/primetickets-YYYYMMDD-HHMMSS.tar.gz -C /tmp/r
#   cp /tmp/r/data.json /var/www/primetickets/backend/db/data.json
#   cp -r /tmp/r/uploads/. /var/www/primetickets/backend/uploads/
#   cp /tmp/r/env /var/www/primetickets/backend/.env     # only if .env was lost
#   pm2 start primetickets
