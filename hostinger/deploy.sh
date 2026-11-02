#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/greencard}"
APP_NAME="${APP_NAME:-greencard}"

cd "$APP_DIR"

if [ -f .env.production ]; then
  set -a
  . ./.env.production
  set +a
fi

echo "→ pulling $APP_DIR"
git pull --ff-only

echo "→ installing dependencies"
npm ci

echo "→ building"
npm run build

echo "→ reloading $APP_NAME"
pm2 reload "$APP_NAME" --update-env

echo "→ health"
curl -fsS -m 10 "http://127.0.0.1:3000/api/health" >/dev/null \
  && echo "ok" \
  || echo "health check failed — inspect: pm2 logs $APP_NAME"
