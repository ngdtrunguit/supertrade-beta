# Create a backup script (backup_db.sh)

#chmod +x backup_db.sh
#crontab -e
# Add line: 0 3 * * * /path/to/backup_db.sh
#!/bin/bash
BACKUP_DIR="/path/to/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="crypto_bot_${TIMESTAMP}.sql"

# Create backup
pg_dump -U crypto_user -d crypto_bot > "${BACKUP_DIR}/${FILENAME}"

# Compress the backup
gzip "${BACKUP_DIR}/${FILENAME}"

# Delete backups older than 30 days
find "${BACKUP_DIR}" -name "crypto_bot_*.sql.gz" -mtime +30 -delete