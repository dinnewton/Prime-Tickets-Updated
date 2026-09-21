#!/bin/bash
# Install the nightly PrimeTickets backup (02:30 server time) as its own
# cron file, so it never touches other projects' crontabs. Run as root.
set -e
cat > /etc/cron.d/primetickets-backup << 'CRON'
# PrimeTickets nightly backup — see /var/www/primetickets/scripts/backup.sh
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
30 2 * * * root bash /var/www/primetickets/scripts/backup.sh >> /var/log/primetickets-backup.log 2>&1
CRON
chmod 644 /etc/cron.d/primetickets-backup
echo "Installed /etc/cron.d/primetickets-backup (daily 02:30). Log: /var/log/primetickets-backup.log"
