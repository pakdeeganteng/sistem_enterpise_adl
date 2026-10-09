# Cart Service

Cart service untuk proyek e-commerce microservices. Service ini menggunakan
Laravel dan PostgreSQL, sementara data produk tetap dimiliki oleh
`product-service`. Di Windows, jalankan perintah dari PowerShell di folder
`cart-service`.

## Langkah 1-2: Project Laravel dan migration bawaan

Project Laravel dan dependency Composer sudah tersedia di folder ini. Migration
bawaan untuk `users`, `cache`, dan `jobs` tidak digunakan; migration aplikasi
hanya membuat tabel `cart_items`.

## Langkah 3: Docker dan PostgreSQL

`Dockerfile`, `.dockerignore`, dan `docker-compose.yml` menyiapkan Laravel dan
database PostgreSQL. Jalankan database saja untuk development lokal:

```powershell
docker compose up -d cart-db
docker compose ps
```

Tunggu sampai status `cart-db` menjadi `healthy`.

## Langkah 4: Konfigurasi environment

`.env` dan `.env.example` menggunakan PostgreSQL, session/cache file, serta
queue sync. Untuk clone baru:

```powershell
Copy-Item .env.example .env
composer install
php artisan key:generate
```

PHP 8.3 atau lebih baru, Composer 2, dan ekstensi PHP `pdo_pgsql` diperlukan.
Di Windows, periksa dengan `php -m | findstr pdo_pgsql`; jika belum muncul,
aktifkan `extension=pdo_pgsql` di `php.ini` lalu buka terminal baru.

Nilai `DB_HOST=127.0.0.1` dipakai saat Laravel dijalankan dari host. Compose
mengganti host database menjadi `cart-db` saat aplikasi berjalan dalam
container.

## Langkah 5-8: API, model, migration, exception, dan service

API tidak memakai prefix `/api`; semua exception dirender sebagai JSON.
Migration membuat `cart_items` dengan `id`, `user_id`, `product_id`,
`quantity` (default `1`), timestamps, dan unique index pada
`user_id` + `product_id`. Tidak ada foreign key ke database milik service lain.

`CartItem` menyediakan scope `forUser()` dan `CartService` mengelola aturan
keranjang. Menjalankan migration dan memeriksa tabel PostgreSQL:

```powershell
php artisan migrate
docker compose exec cart-db psql -U appuser -d cartdb -c "\d cart_items"
```

## Langkah 9-11: Validasi, controller, dan routes

Form request memvalidasi input sebelum controller dipanggil. Controller
membentuk response JSON, menangani item yang tidak ditemukan sebagai `404`,
dan mencatat error tak terduga. Lima route terdaftar:

| Method | Endpoint | Keterangan |
| --- | --- | --- |
| `GET` | `/carts/{userId}` | Ambil isi keranjang satu user |
| `POST` | `/carts` | Tambah item; kuantitas produk yang sama dijumlahkan |
| `PUT` | `/carts/items/{id}` | Ubah kuantitas item |
| `DELETE` | `/carts/items/{id}` | Hapus satu item |
| `DELETE` | `/carts/{userId}` | Kosongkan keranjang user |

```powershell
php artisan route:list
php artisan serve --port=3001
```

API berjalan di `http://localhost:3001`. Contoh request memakai `curl.exe`
(atau kirim body JSON yang sama melalui Postman/Insomnia):

```powershell
curl.exe -X POST http://localhost:3001/carts -H "Content-Type: application/json" -d "{\"user_id\":1,\"product_id\":1,\"quantity\":2}"
curl.exe -X POST http://localhost:3001/carts -H "Content-Type: application/json" -d "{\"user_id\":1,\"product_id\":1,\"quantity\":2}"
curl.exe http://localhost:3001/carts/1
curl.exe -X PUT http://localhost:3001/carts/items/1 -H "Content-Type: application/json" -d "{\"quantity\":5}"
curl.exe -X DELETE http://localhost:3001/carts/items/1
curl.exe -X DELETE http://localhost:3001/carts/1
```

POST pertama membuat item (`201`); POST kedua untuk produk yang sama menambah
kuantitas (`200`). POST tanpa `product_id` atau dengan kuantitas tidak valid
dibalas `422`; PUT/DELETE item yang tidak ditemukan dibalas `404`. Path dengan
ID non-numerik dan path yang tidak dikenal dibalas `404` JSON.

## Langkah 12: Pengujian dan debugging

Pastikan ekstensi `pdo_sqlite` aktif di PHP untuk test suite (selain `pdo_pgsql`
yang diperlukan untuk PostgreSQL).

```powershell
php artisan test
Get-Content storage/logs/laravel.log -Tail 20
```

Untuk melihat response error database, hentikan PostgreSQL sementara dengan
`docker compose stop cart-db`, panggil endpoint yang mengakses database, lalu
periksa log. Saat `APP_DEBUG=true`, response error `500` menyertakan detail
error dan lokasi; saat `APP_DEBUG=false`, detail hanya dicatat ke log.
Nyalakan database kembali dengan `docker compose start cart-db`.

## Langkah 13: Menjalankan lewat Docker

Hentikan server lokal jika sedang berjalan, kemudian dari folder ini jalankan:

```powershell
docker compose up --build
docker compose logs -f cart-service
```

Cart service tersedia di `http://localhost:3001`; log aplikasi container
dikirim ke output standar.

Untuk menjalankan product service bersama cart service, aktifkan blok
`product-service` dan `product-db` yang dikomentari di `docker-compose.yml`,
serta uncomment volume `product-db-data` di bagian bawah. Setelah itu jalankan
`docker compose up --build`.
