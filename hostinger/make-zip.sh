#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="${1:-$(cd "$ROOT/.." && pwd)/greencard-hostinger.zip}"

cd "$ROOT"
rm -f "$OUT"

zip -rq "$OUT" . \
  -x "node_modules/*" \
     ".next/*" \
     ".git/*" \
     ".env" \
     ".env.local" \
     ".env*.local" \
     ".env.production" \
     "test-results/*" \
     "playwright-report/*" \
     "*.zip" \
     ".DS_Store" \
     "**/.DS_Store"

echo "Created $OUT ($(du -h "$OUT" | cut -f1))"
echo "Upload it in hPanel → Node.js app → Upload files."
echo "Secrets are excluded; set them in hPanel → Environment variables."
