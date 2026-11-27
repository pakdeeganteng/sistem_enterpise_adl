import { useEffect, useState } from 'react'
import { Link, Route, Routes, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import CartPage from './pages/CartPage.jsx'
import CheckoutPreviewPage from './pages/CheckoutPreviewPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import PaymentPreviewPage from './pages/PaymentPreviewPage.jsx'
import ProductDetailPage from './pages/ProductDetailPage.jsx'
import ProductListPage from './pages/ProductListPage.jsx'

const USERS = [1, 2, 3, 4, 5]
const USER_STORAGE_KEY = 'userId'

function ScrollToHash() {
  const { hash, pathname } = useLocation()

  useEffect(() => {
    if (!hash) {
      return
    }

    document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({
      block: 'start',
    })
  }, [hash, pathname])

  return null
}

function getStoredUserId() {
  const storedUserId = Number(localStorage.getItem(USER_STORAGE_KEY))
  return USERS.includes(storedUserId) ? storedUserId : USERS[0]
}

function App() {
  const [userId, setUserId] = useState(getStoredUserId)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    localStorage.setItem(USER_STORAGE_KEY, String(userId))
  }, [userId])

  return (
    <div className="app-shell">
      <Navbar
        userId={userId}
        onUserChange={setUserId}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <ScrollToHash />
      <Routes>
        <Route
          path="/"
          element={
            <ProductListPage
              searchQuery={searchQuery}
              userId={userId}
              isCatalogPage={false}
            />
          }
        />
        <Route
          path="/shop"
          element={
            <ProductListPage
              searchQuery={searchQuery}
              userId={userId}
              isCatalogPage
            />
          }
        />
        <Route
          path="/products/:id"
          element={<ProductDetailPage userId={userId} />}
        />
        <Route path="/cart" element={<CartPage userId={userId} />} />
        <Route
          path="/checkout"
          element={<CheckoutPreviewPage userId={userId} />}
        />
        <Route
          path="/payment"
          element={<PaymentPreviewPage userId={userId} />}
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <footer className="site-footer">
        <div className="site-footer__inner">
          <Link className="site-footer__brand" to="/">
            Adul<span>Shop</span>
          </Link>
          <p>Jelajahi katalog elektronik dan aksesori yang tersedia.</p>
          <nav aria-label="Navigasi footer">
            <Link to="/">Beranda</Link>
            <Link to="/shop">Shop</Link>
            <Link to="/cart">Keranjang</Link>
          </nav>
          <small>
            Foto produk dapat berupa referensi kategori. Harga dan stok mengikuti
            data katalog. © {new Date().getFullYear()} ADUL SHOP
          </small>
        </div>
      </footer>
    </div>
  )
}

export default App
