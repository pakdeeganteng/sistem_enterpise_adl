<p align="center"><a href="https://laravel.com" target="_blank"><img src="https://raw.githubusercontent.com/laravel/art/master/logo-lockup/5%20SVG/2%20CMYK/1%20Full%20Color/laravel-logolockup-cmyk-red.svg" width="400" alt="Laravel Logo"></a></p>

<p align="center">
<a href="https://github.com/laravel/framework/actions"><img src="https://github.com/laravel/framework/workflows/tests/badge.svg" alt="Build Status"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/dt/laravel/framework" alt="Total Downloads"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/v/laravel/framework" alt="Latest Stable Version"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/l/laravel/framework" alt="License"></a>
</p>

## About Laravel

Laravel is a web application framework with expressive, elegant syntax. We believe development must be an enjoyable and creative experience to be truly fulfilling. Laravel takes the pain out of development by easing common tasks used in many web projects, such as:

- [Simple, fast routing engine](https://laravel.com/docs/routing).
- [Powerful dependency injection container](https://laravel.com/docs/container).
- Multiple back-ends for [session](https://laravel.com/docs/session) and [cache](https://laravel.com/docs/cache) storage.
- Expressive, intuitive [database ORM](https://laravel.com/docs/eloquent).
- Database agnostic [schema migrations](https://laravel.com/docs/migrations).
- [Robust background job processing](https://laravel.com/docs/queues).
- [Real-time event broadcasting](https://laravel.com/docs/broadcasting).

Laravel is accessible, powerful, and provides tools required for large, robust applications.

## Learning Laravel

Laravel has the most extensive and thorough [documentation](https://laravel.com/docs) and video tutorial library of all modern web application frameworks, making it a breeze to get started with the framework.

In addition, [Laracasts](https://laracasts.com) contains thousands of video tutorials on a range of topics including Laravel, modern PHP, unit testing, and JavaScript. Boost your skills by digging into our comprehensive video library.

You can also watch bite-sized lessons with real-world projects on [Laravel Learn](https://laravel.com/learn), where you will be guided through building a Laravel application from scratch while learning PHP fundamentals.

## Agentic Development

Laravel's predictable structure and conventions make it ideal for AI coding agents like Claude Code, Cursor, and GitHub Copilot. Install [Laravel Boost](https://laravel.com/docs/ai) to supercharge your AI workflow:

```bash
composer require laravel/boost --dev

php artisan boost:install
```

Boost provides your agent 15+ tools and skills that help agents build Laravel applications while following best practices.

## Contributing

Thank you for considering contributing to the Laravel framework! The contribution guide can be found in the [Laravel documentation](https://laravel.com/docs/contributions).

## Code of Conduct

In order to ensure that the Laravel community is welcoming to all, please review and abide by the [Code of Conduct](https://laravel.com/docs/contributions#code-of-conduct).

## Security Vulnerabilities

If you discover a security vulnerability within Laravel, please send an e-mail to Taylor Otwell via [taylor@laravel.com](mailto:taylor@laravel.com). All security vulnerabilities will be promptly addressed.

## License

The Laravel framework is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).

## Menjalankan Order Service di Insomnia

### Menjalankan lewat Docker Compose

Dari folder root repository, jalankan:

```powershell
docker compose up --build order-service gateway
```

Order service tersedia di `http://localhost:3003`, dan melalui gateway di
`http://localhost:8080/orders`.

### 1. Persiapan pertama kali

Buka PowerShell di folder `order-service`, lalu jalankan:

```powershell
composer install
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
if (-not (Test-Path database/database.sqlite)) { New-Item -ItemType File database/database.sqlite | Out-Null }
php artisan key:generate
php artisan migrate
```

Konfigurasi bawaan menggunakan SQLite.

### 2. Jalankan server

Dari folder `order-service`, jalankan:

```powershell
php artisan serve --host=127.0.0.1 --port=8000
```

Biarkan terminal tetap berjalan. Server tersedia di `http://127.0.0.1:8000`.

### 3. Import collection ke Insomnia

Pilih **Import > From File**, lalu pilih [`insomnia/collection.json`](./insomnia/collection.json). Di workspace **Order Service**, pilih environment **Base Environment**. Environment tersebut memakai `base_url` `http://127.0.0.1:8000`.

### 4. Jalankan request

#### Order Service Health

- **Method:** `GET`
- **URL:** `http://127.0.0.1:8000/up`
- **Tab Body:** Pilih **No Body**
- **Langkah:** Klik **Send**. Pastikan response `200 OK`.

#### List Orders

- **Method:** `GET`
- **URL:** `http://127.0.0.1:8000/api/v1/orders`
- **Tab Body:** Pilih **No Body**
- **Langkah:** Klik **Send** untuk mengambil daftar order beserta itemnya.
- **Contoh Output Response:** `200 OK`, order ada di array `data`.

#### Get Order

- **Method:** `GET`
- **URL:** `http://127.0.0.1:8000/api/v1/orders/1`
- **Tab Body:** Pilih **No Body**
- **Langkah:** Ganti `1` dengan `id` order yang didapat dari response **List Orders** atau **Create Order**, lalu klik **Send**.
- **Contoh Output Response:** `200 OK`, data order dan `items`.

#### Create Order

- **Method:** `POST`
- **URL:** `http://127.0.0.1:8000/api/v1/orders`
- **Tab Body:** Pilih **JSON**, lalu isi:

	```json
	{
		"user_id": 1,
		"items": [
			{
				"product_id": 1,
				"quantity": 2
			}
		]
	}
	```

- **Langkah:** Klik **Send**. Catat `data.id` dari response dan isi environment `order_id` dengan nilai tersebut.
- **Contoh Output Response:** `201 Created`, response berisi order dan item; status awal `pending`.

#### Update Order

- **Method:** `PUT`
- **URL:** `http://127.0.0.1:8000/api/v1/orders/1`
- **Tab Body:** Pilih **JSON**, lalu isi:

	```json
	{
		"status": "confirmed",
		"items": [
			{
				"product_id": 1,
				"quantity": 3
			}
		]
	}
	```

- **Langkah:** Ganti `1` dengan `order_id`. Jika `items` dikirim, isinya menggantikan seluruh item lama. Klik **Send**.
- **Contoh Output Response:** `200 OK`, berisi order setelah diperbarui.

#### Delete Order

- **Method:** `DELETE`
- **URL:** `http://127.0.0.1:8000/api/v1/orders/1`
- **Tab Body:** Pilih **No Body**
- **Langkah:** Ganti `1` dengan `order_id`, lalu klik **Send**. Item order ikut terhapus.
- **Contoh Output Response:** `204 No Content`.

Status order yang diterima: `pending`, `confirmed`, `processing`, `shipped`, `delivered`, atau `cancelled`. Endpoint **Order Service Home** (`GET http://127.0.0.1:8000/`) juga tersedia untuk membuka halaman Laravel.
