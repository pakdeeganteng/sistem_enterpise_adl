#!/bin/sh
set -eu

mkdir -p /data
touch "${DB_DATABASE:-/data/orders.sqlite}"

if [ -z "${APP_KEY:-}" ]; then
    if [ -s /data/app.key ]; then
        APP_KEY="$(cat /data/app.key)"
    else
        APP_KEY="$(php artisan key:generate --show)"
        printf '%s\n' "$APP_KEY" > /data/app.key
    fi
    export APP_KEY
fi

php artisan migrate --force
exec php artisan serve --host=0.0.0.0 --port="${PORT:-3003}"
