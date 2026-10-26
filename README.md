# Sistem E-Commerce Microservices

Repository ini berisi beberapa service untuk sistem e-commerce kelas: pengelolaan produk, keranjang, review, dan pesanan, serta aplikasi web React. Setiap service memiliki database dan konfigurasi sendiri; service berkomunikasi melalui HTTP, bukan dengan membaca database service lain secara langsung.

> **Status integrasi:** Compose root saat ini hanya menjalankan Product Service dan database MySQL-nya. Cart dan Review mempunyai Compose terpisah, sedangkan Order Service belum dimasukkan ke Compose gabungan dan belum memiliki container database. Karena tiap Compose membuat network sendiri, konfigurasi saat ini belum dapat menjalankan seluruh sistem sebagai satu stack yang saling terhubung. Instruksi di bawah menjelaskan bagian yang benar-benar tersedia dan batasnya.

## Arsitektur

```text
React/Vite UI (opsional)
       |
       +---- HTTP ----> Product Service (Node.js/Express) ----> MySQL produk
       |
       +---- HTTP ----> Cart Service (Laravel) ----------------> PostgreSQL cart
       |
       +---- HTTP ----> Review Service (Flask) ----> MongoDB review
       |                       |
       |                       +---- HTTP ----> Product Service
       |
       +---- HTTP ----> Order Service (Laravel) --+--> PostgreSQL order*
                                                  +--> Cart Service
                                                  +--> Product Service
```

`*` Order Service dikonfigurasi untuk PostgreSQL, tetapi saat ini tidak ada database atau Compose service Order yang disediakan di repository. Diagram menjelaskan rancangan koneksi aplikasi, bukan bukti bahwa stack gabungan sudah dijalankan.

## Struktur repository

```text
.
├── docker-compose.yml             # Product Service + product-db
├── product-service/               # Node.js, Express, MySQL
│   ├── controllers/
│   ├── database/init.sql
│   ├── models/
│   └── routes/
├── cart-service/                  # Laravel, PostgreSQL
│   ├── app/
│   ├── database/migrations/
│   ├── routes/
│   └── docker-compose.yml
├── review-service/                # Flask, MongoDB
│   ├── app/
│   ├── insomnia/
│   └── docker-compose.yml
├── order-service/                 # Laravel, database order terpisah
│   ├── app/Clients/
│   ├── app/Http/
│   ├── app/Models/
│   ├── app/Services/
│   ├── database/migrations/
│   ├── routes/
│   └── tests/
└── ecommerce-ui/                  # React, Vite, React Router
    └── src/
```

## Service dan port

| Service | Teknologi/database | Port host | Ketersediaan Compose saat ini |
|---|---|---:|---|
| Product Service | Node.js/Express | 3000 | Root Compose dan Review Compose |
| Cart Service | Laravel/PostgreSQL | 3001 | Compose di `cart-service/` |
| Review Service | Flask/MongoDB | 3002 | Compose di `review-service/` |
| Order Service | Laravel/PostgreSQL | 3003 | Dockerfile tersedia; belum ada service di Compose |
| Product DB | MySQL | Root: tidak dipublikasikan; Review Compose: 3307 → 3306 | Root dan Review Compose (stack terpisah) |
| Cart DB | PostgreSQL | 5432 | Cart Compose |
| Review DB | MongoDB | 27017 | Review Compose |
| Order DB | PostgreSQL sesuai konfigurasi saat ini | — | Belum disediakan |
| Ecommerce UI | React/Vite | 5173 (default Vite) | Jalankan lokal, bukan bagian Compose |

Port host harus tersedia saat service terkait dijalankan. Jangan menjalankan dua Compose yang sama-sama memetakan Product Service ke port 3000 secara bersamaan.

## Endpoint

Semua path di bawah digunakan tanpa prefix `/api`.

### Order Service (`http://localhost:3003`)

| Method | Path | Hasil |
|---|---|---|
| GET | `/health` | Status service |
| POST | `/orders` | Checkout dari cart |
| GET | `/orders/{id}` | Detail order beserta items |
| GET | `/orders/user/{userId}` | Order user terbaru; filter status opsional |
| PATCH | `/orders/{id}/pay` | Ubah status `PENDING` menjadi `PAID` |

Contoh checkout:

```http
POST /orders
Content-Type: application/json
Accept: application/json
```

```json
{"user_id": 7}
```

Contoh response sukses (`201`):

```json
{
  "message": "Pesanan berhasil dibuat",
  "data": {
    "id": 41,
    "user_id": 7,
    "status": "PENDING",
    "total_amount": "900000.00",
    "items": [
      {
        "id": 81,
        "order_id": 41,
        "product_id": 11,
        "product_name": "USB Hub",
        "unit_price": "450000.00",
        "quantity": 2,
        "subtotal": "900000.00"
      }
    ]
  }
}
```

ID pada contoh hanya ilustrasi. Field tanggal dapat disertakan Laravel pada response aktual. Validasi menghasilkan `422` dengan `message` dan `errors`; cart kosong, produk hilang, atau stok kurang menghasilkan `409`; kegagalan komunikasi service menghasilkan `503`.

Contoh query daftar/filter:

```text
GET /orders/user/7
GET /orders/user/7?status=PENDING
GET /orders/user/7?status=PAID
GET /orders/41
PATCH /orders/41/pay
```

### Product Service (`http://localhost:3000`)

| Method | Path | Hasil |
|---|---|---|
| GET | `/health` | Status service |
| GET | `/products` | Daftar produk |
| GET | `/products/{id}` | Detail produk; response berisi `data.name`, `data.price`, `data.stock` |
| POST | `/products` | Membuat produk |
| PUT | `/products/{id}` | Mengubah produk |
| DELETE | `/products/{id}` | Menghapus produk |

Checkout Order menggunakan `GET /products/{id}`. Bentuk data produk contoh:

```json
{"data":{"id":11,"name":"USB Hub","price":"450000.00","stock":4}}
```

### Cart Service (`http://localhost:3001`)

| Method | Path | Hasil |
|---|---|---|
| GET | `/health` | Status service |
| GET | `/carts/{userId}` | Cart user |
| POST | `/carts` | Tambah item (`user_id`, `product_id`, opsional `quantity`) |
| PUT | `/carts/items/{id}` | Ubah `quantity` |
| DELETE | `/carts/items/{id}` | Hapus item |
| DELETE | `/carts/{userId}` | Kosongkan cart user |

Order menggunakan GET dan DELETE per-user. Contoh bentuk minimum response GET yang dibaca Order:

```json
{"data":{"user_id":7,"items":[{"product_id":11,"quantity":2}]}}
```

### Review Service (`http://localhost:3002`)

| Method | Path | Hasil |
|---|---|---|
| GET | `/health` | Status service |
| GET | `/reviews/product/{product_id}` | Review untuk produk |
| GET | `/reviews/{review_id}` | Detail review |
| POST | `/reviews` | Membuat review |
| PUT | `/reviews/{review_id}` | Memperbarui review |
| DELETE | `/reviews/{review_id}` | Menghapus review |

POST Review memvalidasi `product_id`, `user_id`, `rating`, dan `comment`; Product Service digunakan untuk memeriksa produk.

## Environment variables

Jangan masukkan file `.env` lokal ke Git. Mulai dari template `.env.example` service terkait, lalu isi nilai lokal sendiri. Template berisi nama variabel dan placeholder, bukan kredensial deployment.

| Service | Variabel yang digunakan |
|---|---|
| Product | `PORT`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`; Compose root menetapkan variabel DB melalui konfigurasi Compose. |
| Cart | Laravel: `APP_NAME`, `APP_ENV`, `APP_KEY`, `APP_DEBUG`, `APP_URL`, `LOG_CHANNEL`, `LOG_LEVEL`; DB: `DB_CONNECTION`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`. Compose Cart juga menetapkan `PORT`. |
| Review | `HOST`, `PORT`, `FLASK_DEBUG`, `MONGO_URI`, `MONGO_DB_NAME`, `PRODUCT_SERVICE_URL`; Compose Review memerlukan `MONGO_INITDB_ROOT_USERNAME`, `MONGO_INITDB_ROOT_PASSWORD`, `MYSQL_ROOT_PASSWORD`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`, `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`. |
| Order | `APP_NAME`, `APP_ENV`, `APP_KEY`, `APP_DEBUG`, `APP_URL`, `PORT`, `CART_SERVICE_URL`, `PRODUCT_SERVICE_URL`, `LOG_CHANNEL`, `LOG_LEVEL`, `DB_CONNECTION`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`. |

Nilai `DB_HOST` untuk koneksi antarkontainer adalah nama service database di network Compose yang sama, bukan `localhost`. URL Cart/Product Order harus mengarah ke hostname dan port yang dapat dijangkau dari container Order. Karena Compose saat ini terpisah, hostname Compose tidak otomatis dapat dipakai lintas stack.

Product Compose root menyimpan nilai pengembangan langsung di YAML. Nilai tersebut bukan secret produksi; konfigurasi ini perlu diperkeras sebelum deployment.

## Menyiapkan environment lokal

Prasyarat yang sesuai dengan berkas proyek: Docker Engine dengan Docker Compose, Node.js/npm untuk Product/UI, PHP dan Composer untuk Laravel, serta Python/pip untuk Review bila menjalankannya di luar container.

### Order Service

```powershell
Set-Location .\order-service
composer install
Copy-Item .env.example .env
php artisan key:generate
```

Sesuaikan `.env` lokal dengan database Order yang memang disediakan untuk pengembangan. Template saat ini memakai PostgreSQL (`DB_CONNECTION=pgsql`), namun tidak ada database Order pada Compose repository. Jangan menjalankan migration sebelum `DB_HOST`, nama database, dan kredensial dipastikan menunjuk ke database Order yang benar.

### Review Service

```powershell
Copy-Item .\review-service\.env.example .\review-service\.env
```

Ganti semua placeholder secret di `.env` lokal dengan nilai unik. Compose Review mewajibkan variabel koneksi MongoDB dan MySQL tersebut. File `.env.example` aman untuk disalin, tetapi Compose belum diuji dalam audit dokumentasi ini.

## Menjalankan dengan Docker Compose

### Stack yang tersedia sekarang

Dari root repository, validasi dan jalankan Product Service:

```powershell
docker compose config
docker compose up --build -d
docker compose ps
docker compose logs --tail 100 product-service product-db
```

Product DB tidak mempublikasikan host port. Database menggunakan volume `product-db-data`; jangan menghapus volume untuk menghentikan stack.

Cart Service dapat dijalankan sebagai stack terpisah:

```powershell
docker compose -f .\cart-service\docker-compose.yml config
docker compose -f .\cart-service\docker-compose.yml up --build -d
docker compose -f .\cart-service\docker-compose.yml ps
```

Review Compose memerlukan `.env` lokal dan mendefinisikan Product Service sendiri. Agar path file dan environment eksplisit:

```powershell
docker compose --env-file .\review-service\.env -f .\review-service\docker-compose.yml config
docker compose --env-file .\review-service\.env -f .\review-service\docker-compose.yml up --build -d
```

Jangan jalankan Review Compose bersamaan dengan root Compose tanpa mengubah rancangan port: keduanya memetakan Product Service ke host port `3000`. Stack-stack terpisah juga tidak berbagi DNS/network. **Belum ada satu perintah Compose yang menjalankan seluruh service bersama-sama**, dan Order Service belum dapat dijalankan melalui Compose repository saat ini. Integrasi tersebut memerlukan perubahan konfigurasi gabungan serta database Order khusus.

Untuk menghentikan stack yang memang dijalankan, gunakan `docker compose ... down` pada file Compose yang sama. Jangan gunakan opsi `-v`; volume berisi data persisten.

## Migration dan testing

Order migrations berada di `order-service/database/migrations/` dan membuat tabel `orders` serta `order_items`. Kedua tabel menyimpan uang dengan `DECIMAL(12,2)`; `order_items.order_id` memiliki foreign key ke `orders.id`.

Migration hanya boleh dijalankan setelah koneksi database Order diverifikasi:

```powershell
Set-Location .\order-service
php artisan migrate:status
php artisan migrate --force
```

Perintah migration di atas **belum dijalankan terhadap database nyata** dalam verifikasi proyek ini. PHPUnit mengatur SQLite `:memory:` untuk test, sehingga test migration tidak mengubah database persisten.

Automated tests Order:

```powershell
Set-Location .\order-service
php artisan test --display-warnings
```

Hasil terakhir yang benar-benar tercatat: **35 test lulus, 174 assertions**. Cakupan mencakup endpoint, transaksi rollback, snapshot harga, validasi client, timeout configuration, logging, dan mode debug. Tes Cart/Product menggunakan HTTP fake; test database memakai SQLite in-memory. Ini bukan integrasi langsung ke service nyata atau PostgreSQL.

Lint PHP:

```powershell
Set-Location .\order-service
Get-ChildItem .\app,.\routes,.\database\migrations,.\tests -Recurse -File -Filter *.php |
    ForEach-Object { php -l $_.FullName }
```

Hasil terakhir yang tercatat: syntax check terhadap 33 file PHP lulus; Pint `--test` juga lulus.

Product/UI dependency install dan pemeriksaan:

```powershell
Set-Location .\product-service
npm ci
npm start
```

```powershell
Set-Location .\ecommerce-ui
npm ci
npm run lint
npm run build
```

Perintah UI membangun aplikasi dan menjalankan lint; status hasil perintah tersebut tergantung pada run lokal masing-masing.

## Arsitektur berlapis Order Service

- **Routes** memetakan URL ke controller.
- **Form Requests** memvalidasi `user_id` dan filter status.
- **Controller** membentuk response HTTP dan menangani pemetaan exception; tidak menjalankan query atau aturan checkout.
- **Clients** menjadi satu-satunya lapisan yang mengirim HTTP ke Cart dan Product Service.
- **OrderService** mengimplementasikan aturan checkout, pembacaan order, dan transisi status pembayaran.
- **Models** (`Order`, `OrderItem`) serta migration mewakili penyimpanan lokal Order Service.
- **Exceptions** membedakan konflik bisnis, order tidak ditemukan, produk tidak ditemukan, dan kegagalan komunikasi.

## Transaksi dan snapshot harga

Checkout mengambil cart dan detail produk melalui service masing-masing, memeriksa stok, lalu mengubah harga menjadi sen sebelum menghitung subtotal/total. Penyimpanan order dan seluruh item dilakukan dalam satu `DB::transaction`; jika pembuatan item gagal, transaksi membatalkan order juga. Harga, nama produk, kuantitas, dan subtotal disimpan sebagai snapshot di `order_items`, sehingga perubahan harga produk berikutnya tidak mengubah order lama.

Setelah transaksi berhasil, Order mencoba mengosongkan cart. Jika permintaan DELETE gagal, error dicatat, order yang sudah tersimpan dipertahankan, dan checkout tetap mengembalikan `201`. Order Service tidak mengurangi stok Product Service dan endpoint pembayaran hanya mengubah status menjadi `PAID`; tidak ada gateway pembayaran.

## Error handling, timeout, dan logging

- Input invalid: `422` dengan `message` dan `errors`.
- Cart kosong, produk tidak ada, atau stok kurang: `409`.
- Kegagalan komunikasi Cart/Product: `503`; produk yang tidak ditemukan dibedakan dari error komunikasi.
- Order tidak ditemukan atau ID nonnumerik: `404`; order yang sudah dibayar: `409`.
- Error internal: `500` dengan pesan generik untuk client; detail exception, file, dan baris dicatat di log server.
- Request keluar ke Cart/Product memiliki timeout maksimum 5 detik dan memvalidasi status, JSON, serta bentuk data response.
- Checkout mencatat konteks operasi, user/order/product ID jika tersedia, dan service terkait. Kegagalan clear cart dicatat sebagai error tetapi tidak membatalkan response sukses.

## Keputusan desain, trade-off, dan keterbatasan

- Setiap service memiliki database sendiri untuk menghindari coupling database lintas service.
- Harga disimpan sebagai DECIMAL dan dihitung sebagai integer sen, bukan floating point.
- HTTP fake membuat tes terisolasi dan cepat, tetapi tidak membuktikan integrasi jaringan nyata.
- Test migration memverifikasi skema melalui SQLite in-memory. Tipe/driver PostgreSQL belum diverifikasi; `pdo_pgsql` tidak tersedia pada lingkungan PHP lokal saat audit terakhir.
- Timeout diperiksa melalui konfigurasi test, bukan penantian jaringan lima detik terhadap service nyata.
- Compose root, Cart, dan Review berdiri sendiri, dengan kemungkinan konflik port dan tanpa shared network. Compose gabungan, Order DB/container, pemeriksaan komunikasi antarservice secara live, serta pengujian dari clone baru belum tersedia/terverifikasi.
- Compose yang ada berisi nilai pengembangan; buat secret unik dan konfigurasi production sebelum deployment. Jangan commit file `.env`.
