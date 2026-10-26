# Sistem E-Commerce Microservices

Repository ini berisi beberapa service untuk sistem e-commerce kelas: pengelolaan produk, keranjang, review, dan pesanan, serta aplikasi web React. Setiap service memiliki database dan konfigurasi sendiri; service berkomunikasi melalui HTTP, bukan dengan membaca database service lain secara langsung.

> **Status integrasi:** Compose root menjalankan Product, Cart, dan Order beserta database masing-masing. Stack ini sudah dibangun dan dijalankan; endpoint health Product/Order dan endpoint baca Cart berhasil diperiksa. Review tetap memakai Compose terpisah, sedangkan Ecommerce UI dijalankan lokal.

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
       +---- HTTP ----> Order Service (Laravel) --+--> MySQL order
                                                  +--> Cart Service
                                                  +--> Product Service
```

Review berjalan sebagai stack terpisah dan tidak otomatis berbagi network Compose root.

## Struktur repository

```text
.
├── docker-compose.yml             # Product, Cart, Order, dan database masing-masing
├── .env.example                   # Environment Compose lokal; APP_KEY dapat dibuat otomatis
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
├── order-service/                 # Laravel, MySQL milik Order Service
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
| Cart Service | Laravel/PostgreSQL | 3001 | Root Compose |
| Review Service | Flask/MongoDB | 3002 | Compose di `review-service/` |
| Order Service | Laravel/MySQL | 3003 | Root Compose |
| Product DB | MySQL | Root: tidak dipublikasikan; Review Compose: 3307 → 3306 | Root dan Review Compose (stack terpisah) |
| Cart DB | PostgreSQL | 5432 | Root Compose |
| Review DB | MongoDB | 27017 | Review Compose |
| Order DB | MySQL | 3307 → 3306 | Root Compose |
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
    "total_amount": 900000,
    "items": [
      {
        "id": 81,
        "order_id": 41,
        "product_id": 11,
        "product_name": "USB Hub",
        "unit_price": 450000,
        "quantity": 2,
        "subtotal": 900000
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

Nilai `DB_HOST` untuk koneksi antarkontainer adalah nama service database di network Compose yang sama, bukan `localhost`. URL Cart/Product Order pada root Compose menggunakan nama service `cart-service` dan `product-service`.

Root Compose memakai kredensial database tetap untuk development lokal; jangan gunakan konfigurasi tersebut untuk deployment produksi. Jika APP_KEY tidak diberikan, container Cart dan Order membuat key saat startup untuk development. Untuk deployment, sediakan key acak yang persisten melalui environment.

## Menyiapkan environment lokal

Prasyarat yang sesuai dengan berkas proyek: Docker Engine dengan Docker Compose, Node.js/npm untuk Product/UI, PHP **8.4.1 atau lebih baru** dan Composer 2 untuk Cart/Order bila menjalankannya di luar container, serta Python/pip untuk Review bila menjalankannya di luar container. Order Service menggunakan MySQL di container database khusus, terpisah dari database Product dan Cart.

### Order Service

```powershell
Set-Location .\order-service
composer install
Copy-Item .env.example .env
php artisan key:generate
```

Untuk menjalankan service lokal tanpa Docker, sesuaikan `.env` dengan database Order yang tersedia; contoh `.env.example` memakai host port `3307`. Di Compose, APP_KEY dibuat otomatis saat container dimulai bila variabelnya kosong. Untuk deployment yang mempertahankan sesi antar-restart, berikan APP_KEY unik melalui environment.

### Review Service

```powershell
Copy-Item .\review-service\.env.example .\review-service\.env
```

Ganti semua placeholder secret di `.env` lokal dengan nilai unik. Compose Review mewajibkan variabel koneksi MongoDB dan MySQL tersebut. File `.env.example` aman untuk disalin, tetapi Compose belum diuji dalam audit dokumentasi ini.

## Menjalankan dengan Docker Compose

Root Compose menjalankan Product, Cart, dan Order beserta database masing-masing. Untuk clone baru, salin file environment bila diperlukan, lalu Compose dapat langsung dijalankan:

```powershell
Copy-Item .env.example .env
docker compose config --services
docker compose config
docker compose up --build -d
docker compose ps
docker compose logs --tail 100 order-service
```

Log service lain dapat dilihat dengan mengganti nama service:

```powershell
docker compose logs -f product-service
docker compose logs -f cart-service
docker compose logs -f order-service
```

Laravel test dijalankan dari root melalui `npm test`, atau langsung dari folder Order:

```powershell
Set-Location .\order-service
php artisan test
```

Review Compose tetap terpisah dan memerlukan `.env` sendiri:

```powershell
docker compose --env-file .\review-service\.env -f .\review-service\docker-compose.yml config
docker compose --env-file .\review-service\.env -f .\review-service\docker-compose.yml up --build -d
```

Jangan jalankan Review Compose bersamaan dengan root Compose tanpa mengubah rancangan port: keduanya memetakan Product Service ke host port `3000`. Compose root menggunakan volume persisten untuk database; jangan gunakan opsi `down -v` jika data ingin dipertahankan.

Untuk menghentikan stack yang memang dijalankan, gunakan `docker compose ... down` pada file Compose yang sama. Jangan gunakan opsi `-v`; volume berisi data persisten.

## Migration dan testing

Order migrations berada di `order-service/database/migrations/` dan membuat tabel `orders` serta `order_items` di MySQL khusus Order Service. Kedua tabel menyimpan uang dengan `DECIMAL(12,2)`; `order_items.order_id` memiliki foreign key ke `orders.id`. Root Compose menjalankan migration Order saat container dimulai dan menunggu database Order berstatus healthy.

Root Compose menjalankan migration Order saat container dimulai. Untuk memeriksa migration dari dalam stack:

```powershell
docker compose exec order-service php artisan migrate:status
```

Untuk menjalankan migration manual, pastikan terlebih dahulu service `order-db` sehat. PHPUnit memakai SQLite `:memory:`, sehingga test tidak mengubah database persisten.

Automated tests Order dari root:

```powershell
npm test
```

Perintah yang sama dapat dijalankan langsung dari folder service dengan `php artisan test`. Suite memakai SQLite `:memory:` dan HTTP fake untuk Cart/Product; runtime Compose menggunakan MySQL, dan test suite bukan integrasi langsung dengan Product/Cart yang berjalan.

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
- Error internal: `500` dengan pesan generik untuk client saat debug mati; detail exception, file, dan baris dicatat di log server dan hanya ditambahkan ke response saat `APP_DEBUG=true`. Aturan serupa berlaku untuk `503`.
- Request keluar ke Cart/Product memiliki timeout maksimum 5 detik dan memvalidasi status, JSON, serta bentuk data response.
- Checkout mencatat konteks operasi, user/order/product ID jika tersedia, dan service terkait. Kegagalan clear cart dicatat sebagai error tetapi tidak membatalkan response sukses.

## Keputusan desain, trade-off, dan keterbatasan

- Setiap service memiliki database sendiri untuk menghindari coupling database lintas service.
- Harga disimpan sebagai DECIMAL dan dihitung sebagai integer sen, bukan floating point.
- HTTP fake membuat tes terisolasi dan cepat, tetapi tidak membuktikan integrasi jaringan nyata.
- Test migration memverifikasi skema melalui SQLite in-memory. Container Order memakai MySQL 8 dan ekstensi PHP `pdo_mysql`.
- Timeout diperiksa melalui konfigurasi test, bukan penantian jaringan lima detik terhadap service nyata.
- Compose root menggabungkan Product, Cart, dan Order dalam satu network; Review tetap memakai stack terpisah. Endpoint health, kontrak baca Cart/Product, dan migration MySQL Order sudah diperiksa live, tetapi checkout penuh antarservice belum diuji end-to-end.
- Compose yang ada berisi nilai pengembangan; buat secret unik dan konfigurasi production sebelum deployment. Jangan commit file `.env`.
