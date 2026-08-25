#!/bin/bash
# Backup diário do banco intranet_tecnotal (mantém os últimos 7)
# Agendar: schtasks /create /tn "TecnoTal Backup" /tr "C:\Users\kauam\Documents\GitHub\TecnoTal\database\backup.bat" /sc daily /st 07:00

BACKUP_DIR="$HOME/tecnotal_backups"
mkdir -p "$BACKUP_DIR"

STAMP=$(date +%Y%m%d_%H%M%S)
FILE="$BACKUP_DIR/intranet_tecnotal_$STAMP.sql"

/c/xampp/mysql/bin/mysqldump.exe -u root intranet_tecnotal > "$FILE" 2>/dev/null

if [ -s "$FILE" ]; then
  # mantém só os 7 mais recentes
  ls -t "$BACKUP_DIR"/intranet_tecnotal_*.sql 2>/dev/null | tail -n +8 | xargs -r rm -f
  echo "OK: $FILE ($(du -h "$FILE" | cut -f1))"
else
  echo "ERRO: backup vazio ou falhou"
  exit 1
fi
