#!/usr/bin/env bash
# Run on sg-files-prod inside /var/www/calorie-tracker after the initial setup
# (see deploy/README.md). Re-run on every update.
set -euo pipefail

cd "$(dirname "$0")/.."

git pull

npm ci
npm run build

npm --prefix server ci
npm --prefix server run build

pm2 restart calorie-api || pm2 start ecosystem.config.cjs
pm2 save
