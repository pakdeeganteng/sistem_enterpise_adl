# Cart Service

Cart service untuk proyek e-commerce microservices. Service ini menggunakan
Laravel dan PostgreSQL, sementara data produk tetap dimiliki oleh
`product-service`. Dari root repository, stack utama yang menghubungkan Product,
Cart, dan Order dijalankan lewat `docker-compose.yml` root. Petunjuk di bawah
tetap berlaku untuk menjalankan Cart secara mandiri dari folder ini.

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

Untuk menjalankan stack terintegrasi dari root repository, gunakan `docker
compose up --build -d`; APP_KEY Cart dan Order harus lebih dulu diisi di `.env`
root sesuai petunjuk pada README utama.

## Langkah 4: Konfigurasi environment

`.env` dan `.env.example` menggunakan PostgreSQL, session/cache file, serta
queue sync. Untuk clone baru:

```powershell
Copy-Item .env.example .env
composer install
php artisan key:generate
```

PHP 8.4.1 atau lebih baru, Composer 2, dan ekstensi PHP `pdo_pgsql` diperlukan
agar sesuai dengan versi dependency pada `composer.lock`.
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

Untuk menjalankan Cart bersama Product dan Order, gunakan Compose root. Jangan
mengaktifkan stack Cart mandiri bersamaan dengan root Compose karena keduanya
menggunakan host port `3001` dan `5432`.

## Deploy demo publik dari GitHub ke Render

Root repository menyediakan `render.yaml` untuk membuat web service Docker
beserta PostgreSQL terkelola. Deploy awal dilakukan dari Render; setelah
repository tersambung, push ke branch `main` akan memicu deploy berikutnya.

1. Push perubahan ke GitHub.
2. Masuk ke [Render Dashboard](https://dashboard.render.com/), pilih **New**,
   lalu **Blueprint**.
3. Hubungkan repository `pakdeeganteng/sistem_enterpise_adl`, pilih branch
   `main`, dan konfirmasi deploy Blueprint.
4. Tunggu web service `cart-service` dan database `cart-db` selesai dibuat.
   Render mengisi `APP_KEY` dan konfigurasi database dari Blueprint; tidak
   perlu menyalin `.env` lokal ke GitHub.
5. Buka URL `onrender.com` milik web service dan cek `/up`. Request API memakai
   URL yang sama, misalnya `/carts/1`.

Blueprint menggunakan instance gratis untuk demo. Render dapat menidurkan web
service gratis setelah tidak aktif dan PostgreSQL gratis memiliki batas masa
simpan; jangan gunakan konfigurasi gratis untuk data penting atau produksi.
API ini belum memiliki autentikasi dan URL publik memungkinkan siapa saja
mengakses keranjang berdasarkan `user_id`. Gunakan hanya untuk demo/testing
dengan data yang tidak sensitif, atau tambahkan autentikasi sebelum menyimpan
data nyata.
