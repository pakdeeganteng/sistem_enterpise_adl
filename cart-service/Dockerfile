FROM php:8.4-cli

RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq-dev unzip git \
    && docker-php-ext-install pdo_pgsql \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

ENV COMPOSER_ALLOW_SUPERUSER=1

WORKDIR /app

COPY . .
RUN composer install --no-interaction --prefer-dist --optimize-autoloader

EXPOSE 3001

CMD ["sh", "-c", "php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=\"${PORT:-3001}\""]
