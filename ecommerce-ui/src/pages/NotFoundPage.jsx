import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <main className="page not-found">
      <p className="eyebrow">404</p>
      <h1>Halaman tidak ditemukan</h1>
      <p>Halaman yang Anda cari tidak tersedia.</p>
      <Link to="/">Kembali ke beranda</Link>
    </main>
  )
}

export default NotFoundPage
