# Sistem E-Commerce Microservices

Project e-commerce dengan React UI, API Gateway, dan service terpisah untuk produk, cart, review, serta order. Semua service dijalankan dalam satu Docker Compose network.

## Arsitektur

```text
Browser (React UI :5173)
          |
          v
     API Gateway :8080
      /    |    |    \
 Product  Cart Review Order
  :3000   :3001 :3002 :3003
```

Product menggunakan MySQL, Cart menggunakan PostgreSQL, Review menggunakan MongoDB, dan Order menyimpan data menggunakan SQLite pada volume Docker.

## API Gateway

Gateway tersedia di `http://localhost:8080`. `GET /` menampilkan route map:

```json
{
  "service": "AdulShop API Gateway",
  "status": "ok",
  "routes": [
    "/products",
    "/carts",
    "/reviews",
    "/orders"
  ]
}
```

Endpoint `/catalog` adalah alias untuk katalog produk. Gateway meneruskan `/orders` ke endpoint Order Service dengan prefix `/api/v1`.

| Gateway path | Service |
| --- | --- |
| `/products` | Product Service |
| `/catalog` | Alias katalog Product Service |
| `/carts` | Cart Service |
| `/reviews` | Review Service |
| `/orders` | Order Service |
| `/health` | Health Gateway |

Rincian konfigurasi ada di [`gateway/README.md`](./gateway/README.md).

## Menjalankan aplikasi

Prasyarat: Docker Engine dan Docker Compose. Siapkan environment Review untuk Compose:

```powershell
Copy-Item .\review-service\.env.example .\review-service\.env
```

Nilai pada template ditujukan untuk development lokal. Gunakan secret unik untuk lingkungan bersama atau deployment.

Dari root repository:

```powershell
docker compose config --quiet
docker compose up --build -d
docker compose ps
```

Buka UI di `http://localhost:5173`. Gateway bisa diperiksa di `http://localhost:8080`; katalog produk tersedia di `http://localhost:8080/catalog`.

Untuk melihat log atau menghentikan stack:

```powershell
docker compose logs -f gateway
docker compose down
```

`docker compose down` mempertahankan volume database. Jangan tambahkan `-v` kecuali memang ingin menghapus data.

## Service dan port

| Service | Port host | Penyimpanan |
| --- | ---: | --- |
| Ecommerce UI | 5173 | — |
| API Gateway | 8080 | — |
| Product Service | 3000 | MySQL |
| Cart Service | 3001 | PostgreSQL |
| Review Service | 3002 | MongoDB |
| Order Service | 3003 | SQLite |
| Review DB | 27017 | MongoDB |

Database Product dan Cart hanya tersedia di network Compose. Order database disimpan pada volume Docker, bukan file lokal repository.

## Pemeriksaan

UI:

```powershell
Set-Location .\ecommerce-ui
npm ci
npm run lint
npm run build
```

Order Service:

```powershell
Set-Location .\order-service
composer install
php artisan test
```

Jangan commit file `.env`; gunakan file `.env.example` sebagai template konfigurasi lokal.
