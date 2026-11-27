# Skenario Demo ADUL SHOP

Dokumen ini berisi panduan presentasi dan uji alur untuk aplikasi React di folder `ecommerce-ui`. Aplikasi memakai Vite, berkomunikasi langsung dari browser dengan product-service, cart-service, dan review-service, lalu menggabungkan data antarlayanan di frontend. Tidak ada API Gateway atau proxy pada alur ini.

## 1. Tujuan demo

Setelah demo, audiens diharapkan memahami bahwa pengguna dapat:

1. Melihat, mencari, dan memfilter produk.
2. Membuka detail produk, membaca ulasan, serta mengirim ulasan.
3. Menambahkan produk dan mengelola keranjang.
4. Melihat pratinjau checkout dan pembayaran, dengan pemahaman bahwa transaksi belum benar-benar diproses.

Demo juga menunjukkan cara frontend menangani loading, error, dan kegagalan parsial layanan.

## 2. Persiapan sebelum presentasi

### Pilihan A — Menjalankan seluruh aplikasi dengan Docker Compose

Buka PowerShell di direktori root proyek, lalu jalankan:

```powershell
docker compose up -d --build
docker compose ps
```

Pastikan container layanan dan database sudah berjalan. Inisialisasi database saat pertama kali dijalankan dapat memerlukan waktu tambahan.

- UI: <http://localhost:5173>
- Product service: <http://localhost:3000>
- Cart service: <http://localhost:3001>
- Review service: <http://localhost:3002>

Alamat health check untuk layanan:

- <http://localhost:3000/health>
- <http://localhost:3002/health>
- Cart service menyediakan endpoint pemeriksaan Laravel di <http://localhost:3001/up>.

### Pilihan B — Menjalankan UI dengan Vite

Jalankan ketiga service dan database terlebih dahulu. Setelah itu, dari PowerShell:

```powershell
Set-Location .\ecommerce-ui
npm install
npm run dev
```

Buka alamat Vite yang ditampilkan di terminal, biasanya <http://localhost:5173>. Alamat service dibaca dari `ecommerce-ui/.env`. Jika file tersebut diubah, mulai ulang server Vite.

> Gunakan salah satu cara untuk UI. Jangan menjalankan UI dari Docker dan Vite pada port yang sama secara bersamaan.

### Pemeriksaan singkat

- Halaman utama dapat dibuka dan daftar produk muncul.
- Dropdown **User** menampilkan user 1 sampai 5.
- Untuk memeriksa kegagalan CORS atau jaringan, buka DevTools browser → **Console** dan **Network**. Jangan mengubah konfigurasi CORS atau Vite proxy selama demo; browser memang mengakses ketiga service secara langsung.
- Untuk demonstrasi yang lancar, gunakan browser dengan lebar desktop dan siapkan terminal di direktori root proyek.

## 3. Alur presentasi utama

Alur ini dirancang untuk presentasi sekitar 8–12 menit. Gunakan satu user dan satu produk selama alur keranjang; contoh di bawah menggunakan **User 1** dan **Headset Gaming RGB**. Jika data review sudah pernah dibuat, gunakan kombinasi user dan produk yang belum pernah dipakai untuk menulis review.

### Bagian A — Beranda dan katalog

1. Buka <http://localhost:5173>.
2. Tunjukkan header, kolom pencarian, pilihan user, navigasi, dan tombol keranjang.
3. Tunggu daftar produk dimuat.
4. Jelaskan bahwa katalog berasal dari product-service, sedangkan rating diminta dari review-service untuk setiap produk.
5. Coba filter:
   - **Stok tersedia** untuk menampilkan produk yang stoknya lebih dari nol.
   - **Sudah memiliki rating** untuk menampilkan produk dengan ulasan.
   - **Semua produk** untuk kembali ke daftar penuh.
6. Ketik kata seperti `headset` di kolom pencarian, lalu tekan **Cari**. Pastikan hasil katalog tersaring. Hapus kata pencarian dan tekan **Cari** untuk kembali ke daftar penuh.
7. Tunjukkan bagian **Pilihan pelanggan** jika ada produk dengan ulasan. Bagian ini diurutkan menurut rating dan jumlah ulasan.

**Hasil yang diharapkan:** produk dapat ditampilkan dan dicari; filter stok bekerja; rating muncul jika tersedia. Produk tanpa ulasan menampilkan **Belum ada ulasan**. Jika review-service tidak dapat diakses, katalog tetap tampil dan status rating ditampilkan sebagai tidak tersedia.

**Narasi yang dapat digunakan:** “Frontend mengambil katalog dan ringkasan ulasan dari dua layanan berbeda, kemudian menggabungkannya di browser. Karena permintaan rating bersifat tambahan, kegagalannya tidak menghilangkan seluruh katalog.”

### Bagian B — Detail produk dan review

1. Pilih **Lihat detail** pada Headset Gaming RGB.
2. Tunjukkan nama, deskripsi, harga rupiah, stok, rating, dan daftar ulasan.
3. Di bagian **Tulis ulasan**, pilih rating, misalnya 4, lalu isi komentar singkat. Komentar dibatasi maksimal 1.000 karakter.
4. Pastikan dropdown navigasi menunjukkan **User 1**, lalu tekan **Kirim review**.
5. Tunggu ulasan muncul pada daftar. Rating ringkasan produk juga akan diperbarui.
6. Kembali ke beranda/shop untuk menunjukkan bahwa rating produk ikut berubah di kartu katalog.
7. (Opsional) Kembali ke detail produk dan kirim review lagi untuk produk dan user yang sama. Service menolak review duplikat; pesan error dari server tampil pada formulir.
8. (Opsional) Ganti user melalui dropdown menjadi user lain, lalu kirim review untuk produk tersebut. Satu user hanya dapat membuat satu review untuk produk yang sama.

**Hasil yang diharapkan:** review berhasil tampil setelah dikirim; pengiriman pasangan user-produk yang sama untuk kedua kalinya ditolak; ulasan dari user berbeda dapat dibuat selama pasangan tersebut belum pernah digunakan.

**Catatan data:** review tersimpan di database, jadi data dapat tetap ada setelah aplikasi dimulai ulang. Hindari mengandalkan User 1 atau produk tertentu untuk selalu menjadi kombinasi yang belum pernah mengulas.

### Bagian C — Menambahkan produk dan mengelola keranjang

1. Dari detail produk, pastikan stok tersedia dan jumlah bernilai `1`.
2. Ubah jumlah menjadi `2`, lalu tekan **Tambah ke keranjang**.
3. Tunjukkan pesan berhasil.
4. Buka halaman **Keranjang** melalui navigasi.
5. Tunjukkan nama produk, harga per item, jumlah, subtotal, dan total.
6. Tekan tombol **+**. Pastikan jumlah dan total diperbarui.
7. Tekan tombol **−**. Pastikan jumlah dan total berkurang.
8. Jika jumlah mencapai satu, tombol **−** menghapus baris tersebut. Tambahkan produk lagi jika ingin mencoba penghapusan melalui tombol **Hapus** secara terpisah.
9. (Opsional) Tambahkan produk kedua ke keranjang agar tampak jelas bahwa total merupakan penjumlahan beberapa subtotal.
10. Ganti pilihan User di navbar dan buka keranjang. Keranjang diminta menggunakan ID user yang dipilih, sehingga dapat diperlihatkan sebagai keranjang user yang berbeda.
11. Kembalikan ke User 1 untuk melanjutkan demonstrasi.

**Hasil yang diharapkan:** operasi tambah, kurangi, hapus, dan hitung total bekerja; perubahan jumlah dibatasi stok produk. Data detail produk di keranjang diambil dari product-service, karena cart-service menyimpan ID produk dan jumlah.

### Bagian D — Pratinjau checkout dan payment

1. Dari keranjang User 1, tekan **Lanjut ke checkout**.
2. Tunjukkan ringkasan item dan total pesanan.
3. Sorot pemberitahuan bahwa checkout hanya pratinjau dan belum membuat pesanan.
4. Tekan **Lanjut ke pratinjau payment**.
5. Tunjukkan bahwa belum ada payment gateway dan belum ada pembayaran atau pesanan yang diproses.
6. Gunakan tombol **Kembali ke checkout** atau **Kembali ke toko** untuk kembali.

**Penting:** halaman checkout dan payment adalah rancangan/pratinjau. Jangan menjanjikan pembuatan pesanan, pengiriman pembayaran, atau integrasi payment gateway.

### Bagian E — Footer, navigasi, dan halaman tidak ditemukan

1. Gulir ke bawah untuk menunjukkan footer dan navigasi footer.
2. Coba navigasi **Beranda**, **Shop**, **Semua produk**, **Keranjang**, dan tautan ke bagian keunggulan.
3. Buka <http://localhost:5173/products/999>. Product service akan mengembalikan error produk tidak ditemukan; halaman menampilkan pesan dan tombol **Coba lagi**.
4. Buka <http://localhost:5173/halaman-tidak-ada>. Aplikasi menampilkan halaman tidak ditemukan.

**Hasil yang diharapkan:** navigasi internal bekerja, tautan hash menggulir ke bagian yang dituju, dan rute yang tidak dikenal tidak merusak aplikasi.

## 4. Skenario tambahan: loading, retry, dan kegagalan layanan

Skenario berikut opsional. Jalankan hanya jika waktu cukup, dan jangan lakukan saat pengguna lain sedang memakai stack Compose yang sama. Gunakan terminal PowerShell kedua di direktori root proyek.

### Product service tidak tersedia

1. Hentikan sementara service:

   ```powershell
   docker compose stop product-service
   ```

2. Muat ulang halaman katalog atau keranjang.
3. Katalog tidak dapat dimuat; halaman keranjang juga bergantung pada product-service untuk nama dan harga item.
4. Nyalakan kembali service:

   ```powershell
   docker compose start product-service
   ```

5. Tunggu health check pulih, lalu tekan **Coba lagi** atau muat ulang halaman.

### Review service tidak tersedia

1. Hentikan sementara service:

   ```powershell
   docker compose stop review-service
   ```

2. Muat ulang katalog. Produk tetap tampil, tetapi rating tidak tersedia.
3. Buka detail produk. Data produk tetap tampil, sedangkan ulasan menunjukkan bahwa ulasan tidak dapat dimuat.
4. Nyalakan kembali service:

   ```powershell
   docker compose start review-service
   ```

5. Muat ulang halaman untuk mengambil ulasan kembali.

### Cart service tidak tersedia

1. Hentikan sementara service:

   ```powershell
   docker compose stop cart-service
   ```

2. Buka halaman keranjang atau coba menambahkan produk. UI menampilkan error layanan.
3. Nyalakan kembali service:

   ```powershell
   docker compose start cart-service
   ```

4. Tekan **Coba lagi** pada keranjang atau ulangi tindakan setelah service pulih.

> Pastikan service yang dihentikan dinyalakan kembali sebelum demo dilanjutkan. Perintah `docker compose down -v` menghapus volume database dan tidak diperlukan untuk skenario ini; jangan gunakan untuk membersihkan data demo.

## 5. Ringkasan layanan yang dipanggil

| Aksi di UI | Layanan yang digunakan | Contoh endpoint |
|---|---|---|
| Menampilkan katalog | Product service | `GET /products` |
| Mengambil rating katalog | Review service | `GET /reviews/product/{id}` |
| Menampilkan detail | Product dan review service | `GET /products/{id}`, `GET /reviews/product/{id}` |
| Membuat review | Review service | `POST /reviews` |
| Menambah item | Cart service | `POST /carts` |
| Menampilkan keranjang | Cart dan product service | `GET /carts/{userId}`, `GET /products/{id}` per item |
| Mengubah item | Cart service | `PUT /carts/items/{id}`, `DELETE /carts/items/{id}` |
| Mengosongkan keranjang | Cart service | `DELETE /carts/{userId}` |

Permintaan tambahan per produk/item adalah pola 1+N yang memang digunakan proyek ini untuk pembelajaran komunikasi langsung antarservice dari browser.

## 6. Troubleshooting cepat

| Gejala | Pemeriksaan |
|---|---|
| UI tidak dapat dibuka | Periksa `docker compose ps`; pastikan port 5173 tidak dipakai proses lain. |
| Katalog menampilkan error | Periksa product-service dan database produk; coba tombol **Coba lagi** setelah service pulih. |
| Produk tampil tanpa rating | Periksa review-service dan Console/Network browser. Jika layanan mati, katalog memang tetap ditampilkan. |
| Keranjang tidak dapat dimuat | Periksa cart-service dan product-service; gunakan **Coba lagi** setelah keduanya sehat. |
| Browser melaporkan CORS | Periksa header/error di Console dan Network, lalu pastikan perubahan CORS pada service telah terbangun dan container memakai konfigurasi terbaru. UI sengaja tidak memakai Vite proxy. |
| Perubahan `.env` tidak terbaca | Hentikan lalu mulai ulang Vite; untuk Docker, bangun ulang image UI karena URL service tertanam saat build. |
| Review ditolak | Pastikan rating valid dan pasangan user-produk belum pernah membuat review. Penolakan duplikat merupakan aturan service, bukan error tampilan. |
| Tombol tambah produk nonaktif | Periksa stok dan jumlah yang diminta. Jumlah tidak boleh melebihi stok. |

## 7. Penutup presentasi

Contoh kesimpulan:

> “UI React ini sudah menghubungkan katalog, keranjang, dan review ke tiga service secara langsung. Frontend menggabungkan sebagian data, menampilkan loading dan error, serta tetap menjaga katalog tetap terlihat ketika layanan review gagal. Checkout dan payment masih berupa pratinjau. Pendekatan langsung ini juga memperlihatkan kebutuhan pengaturan CORS dan banyaknya permintaan 1+N, yang menjadi bahan untuk pembahasan API Gateway berikutnya.”

## 8. Menghentikan aplikasi setelah demo

Jika seluruh stack dijalankan dengan Docker Compose dan sudah tidak dipakai:

```powershell
docker compose down
```

Perintah tersebut menghentikan container tanpa menghapus volume database. Jangan tambahkan `-v` kecuali memang ingin menghapus data persisten dan sudah mendapat persetujuan.
