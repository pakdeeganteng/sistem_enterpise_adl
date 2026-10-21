# Review Service

## Menjalankan service

Siapkan file environment lokal dari template:

```powershell
Copy-Item .env.example .env
```

Edit `.env` dan ganti semua nilai `CHANGE_ME...` dengan password unik. Pastikan password MongoDB di `MONGO_URI` sama dengan `MONGO_INITDB_ROOT_PASSWORD`, dan password user MySQL di `DB_PASSWORD` sama dengan `MYSQL_PASSWORD`.

Dari folder `review-service`, jalankan Docker Compose untuk menyalakan Review Service, MongoDB, Product Service, dan database produk:

```powershell
docker compose --env-file .env up --build -d
```

Pastikan service aktif dengan membuka `http://localhost:3002/health`. Untuk melihat log:

```powershell
docker compose logs -f review-service
```

## Menjalankan request di Insomnia

1. Buka Insomnia, pilih **Import** → **File**, lalu pilih `insomnia/collection.json` di folder ini.
2. Pilih environment **Base Environment**. `base_url` sudah diatur ke `http://localhost:3002` dan `product_id` ke `1` (produk contoh dari Product Service).
3. Jalankan **Review Service Health** atau **Get Reviews by Product** untuk memeriksa koneksi.
4. Jalankan **Create Review (POST)**. Jika muncul pesan bahwa user sudah pernah memberi review untuk produk tersebut, ubah `user_id` di environment ke angka baru lalu kirim ulang.
5. Salin nilai `data.id` dari response POST ke `review_id` di **Base Environment**.
6. Jalankan **Get Review by ID (GET)**, **Update Review (PUT)**, atau **Delete Review (DELETE)** dengan `review_id` tersebut.

Request POST mengirim `product_id`, `user_id`, `rating` (bilangan bulat 1–5), dan `comment`. PUT menerima `rating` dan/atau `comment`. GET dan DELETE menggunakan ID review hasil POST.

Untuk menghentikan service:

```powershell
docker compose --env-file .env down
```
