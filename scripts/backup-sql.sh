#!/usr/bin/env bash
# RusWallet — günlük SQL Server .bak yedeği + rclone crypt ile Backblaze B2'ye şifreli yükleme.
# VPS'te sistem cron'u ile çalıştırılır (ör. 0 3 * * * /opt/ruswallet/scripts/backup-sql.sh).
# Herhangi bir adım başarısız olursa script hatayla sonlanır ve healthchecks'e BAŞARI ping'i atılmaz.
set -euo pipefail

# --- Yapılandırma: deploy/.env.production'dan okunur (gizli değerler repo'da değil) ---
ENV_FILE="${RUSWALLET_ENV_FILE:-/opt/ruswallet/deploy/.env.production}"
COMPOSE_FILE="${RUSWALLET_COMPOSE_FILE:-/opt/ruswallet/deploy/docker-compose.prod.yml}"
BACKUP_HOST_DIR="${RUSWALLET_BACKUP_DIR:-/opt/ruswallet/deploy/backup}"

if [[ -f "$ENV_FILE" ]]; then
  # `source` kullanılmıyor: connection string gibi değerler noktalı virgül içerebilir
  # ve bash bunu komut ayracı sayıp satırı bozar. Satırlar literal KEY=VALUE olarak okunur.
  while IFS='=' read -r _env_key _env_value; do
    [[ -z "$_env_key" || "$_env_key" == \#* ]] && continue
    export "${_env_key}=${_env_value}"
  done < "$ENV_FILE"
fi

: "${COMPOSE_SQL_SERVICE:?COMPOSE_SQL_SERVICE tanımlı değil}"
: "${MSSQL_SA_PASSWORD:?MSSQL_SA_PASSWORD tanımlı değil}"
: "${RCLONE_REMOTE:?RCLONE_REMOTE tanımlı değil}"
: "${RCLONE_CONFIG_PATH:?RCLONE_CONFIG_PATH tanımlı değil}"
: "${HEALTHCHECK_PING_URL:?HEALTHCHECK_PING_URL tanımlı değil}"
HEALTHCHECK_PING_FAIL_URL="${HEALTHCHECK_PING_FAIL_URL:-}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"

# Tarih SQL komutunda değil, script tarafında üretilir.
DATE_STR="$(date +%F)"
DB_NAME="RusWalletDb"
BAK_FILENAME="${DB_NAME}_${DATE_STR}.bak"
CONTAINER_BAK_PATH="/var/opt/mssql/backup/${BAK_FILENAME}"
HOST_BAK_PATH="${BACKUP_HOST_DIR}/${BAK_FILENAME}"

notify_failure() {
  if [[ -n "$HEALTHCHECK_PING_FAIL_URL" ]]; then
    curl -fsS -m 10 --retry 3 "$HEALTHCHECK_PING_FAIL_URL" >/dev/null 2>&1 || true
  fi
}
trap 'notify_failure' ERR

echo "[1/6] SQL Server BACKUP DATABASE çalıştırılıyor (${BAK_FILENAME})..."
docker compose -f "$COMPOSE_FILE" exec -T "$COMPOSE_SQL_SERVICE" \
  /opt/mssql-tools18/bin/sqlcmd -C -S localhost -U sa -P "$MSSQL_SA_PASSWORD" \
  -Q "BACKUP DATABASE [${DB_NAME}] TO DISK = N'${CONTAINER_BAK_PATH}' WITH INIT, CHECKSUM;"

echo "[2/6] Yerel yedek dosyası doğrulanıyor..."
if [[ ! -s "$HOST_BAK_PATH" ]]; then
  echo "HATA: ${HOST_BAK_PATH} oluşmadı veya boş." >&2
  exit 1
fi
LOCAL_SIZE="$(stat -c%s "$HOST_BAK_PATH")"

echo "[3/6] RESTORE VERIFYONLY ile yedek bütünlüğü kontrol ediliyor..."
docker compose -f "$COMPOSE_FILE" exec -T "$COMPOSE_SQL_SERVICE" \
  /opt/mssql-tools18/bin/sqlcmd -C -S localhost -U sa -P "$MSSQL_SA_PASSWORD" \
  -Q "RESTORE VERIFYONLY FROM DISK = N'${CONTAINER_BAK_PATH}';"

echo "[4/6] rclone crypt ile Backblaze B2'ye yükleniyor..."
export RCLONE_CONFIG="$RCLONE_CONFIG_PATH"
rclone copy "$HOST_BAK_PATH" "${RCLONE_REMOTE}/" --checksum

echo "[5/6] Uzak yedeğin varlığı ve boyutu doğrulanıyor..."
REMOTE_SIZE="$(rclone size "${RCLONE_REMOTE}/${BAK_FILENAME}" --json | grep -o '"bytes":[0-9]*' | head -1 | cut -d: -f2)"
if [[ -z "$REMOTE_SIZE" || "$REMOTE_SIZE" != "$LOCAL_SIZE" ]]; then
  echo "HATA: Uzak dosya boyutu doğrulanamadı (yerel=${LOCAL_SIZE}, uzak=${REMOTE_SIZE:-yok})." >&2
  exit 1
fi

echo "[6/6] Doğrulanmış yedek sonrası retention (yerel + uzak, ${BACKUP_RETENTION_DAYS} gün)..."
find "$BACKUP_HOST_DIR" -maxdepth 1 -name "${DB_NAME}_*.bak" -mtime "+${BACKUP_RETENTION_DAYS}" -print -delete
rclone delete "${RCLONE_REMOTE}/" --min-age "${BACKUP_RETENTION_DAYS}d" --include "${DB_NAME}_*.bak"

curl -fsS -m 10 --retry 3 "$HEALTHCHECK_PING_URL" >/dev/null
echo "Yedekleme tamamlandı: ${BAK_FILENAME}"
