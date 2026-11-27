import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { getCart } from '../api/cartApi.js'
import { useAsync } from '../hooks/useAsync.js'
import './components.css'

const USERS = [1, 2, 3, 4, 5]

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="10.8" cy="10.8" r="6.8" />
      <path d="m16 16 4.2 4.2" />
    </svg>
  )
}

function AccountIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c.7-3.5 3.4-5.3 7.5-5.3s6.8 1.8 7.5 5.3" />
    </svg>
  )
}

function MenuIcon({ open }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {open ? <path d="m6 6 12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
    </svg>
  )
}

function BagIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 8h14l1 13H4L5 8Z" />
      <path d="M9 9V6a3 3 0 0 1 6 0v3" />
    </svg>
  )
}

function Navbar({ userId, onUserChange, searchQuery, onSearchChange }) {
  const [internalUserId, setInternalUserId] = useState(USERS[0])
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const selectedUserId = userId ?? internalUserId
  const navigate = useNavigate()
  const {
    data: cart,
    error: cartError,
    reload: reloadCart,
  } = useAsync(() => getCart(selectedUserId), [selectedUserId])
  const cartCount = (cart?.data?.items ?? []).reduce(
    (total, item) => total + Number(item.quantity || 0),
    0,
  )

  useEffect(() => {
    window.addEventListener('adulshop:cart-updated', reloadCart)
    return () =>
      window.removeEventListener('adulshop:cart-updated', reloadCart)
  }, [reloadCart])

  function handleUserChange(event) {
    const nextUserId = Number(event.target.value)
    setInternalUserId(nextUserId)
    onUserChange?.(nextUserId)
  }

  function handleSearch(event) {
    event.preventDefault()
    setMobileSearchOpen(false)
    setMobileMenuOpen(false)
    navigate('/shop#products')
  }

  function handleNavigation() {
    setMobileMenuOpen(false)
    setMobileSearchOpen(false)
  }

  function renderUserSelector(className = '') {
    return (
      <label className={`navbar__user ${className}`.trim()}>
        <AccountIcon />
        <span>Akun demo</span>
        <select
          aria-label="Pilih User ID"
          value={selectedUserId}
          onChange={handleUserChange}
        >
          {USERS.map((id) => (
            <option key={id} value={id}>
              ID {id}
            </option>
          ))}
        </select>
      </label>
    )
  }

  return (
    <header className="site-header">
      <div className="announcement">
        <div className="announcement__inner">
          <span className="announcement__message">
            <span className="announcement__mark" aria-hidden="true">✓</span>
            Harga dan stok mengikuti katalog produk yang tersedia
          </span>
          <span className="announcement__locale" aria-label="Bahasa Indonesia, mata uang Rupiah">
            ID <span aria-hidden="true">|</span> IDR
          </span>
        </div>
      </div>
      <div className="navbar">
        <div className="navbar__main">
          <button
            className="navbar__menu-toggle"
            type="button"
            aria-label={mobileMenuOpen ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={mobileMenuOpen}
            onClick={() => {
              setMobileMenuOpen((open) => !open)
              setMobileSearchOpen(false)
            }}
          >
            <MenuIcon open={mobileMenuOpen} />
          </button>
          <Link className="navbar__brand" to="/" aria-label="AdulShop, beranda">
            <img
              className="navbar__logo"
              src="/assets/adulshop-logo-horizontal.svg"
              alt=""
              width="260"
              height="72"
            />
          </Link>

          <nav className={`navbar__nav${mobileMenuOpen ? ' is-open' : ''}`} aria-label="Navigasi utama">
            <NavLink end to="/" onClick={handleNavigation}>Home</NavLink>
            <NavLink to="/shop" onClick={handleNavigation}>Shop</NavLink>
            <Link to="/#category-showcase" onClick={handleNavigation}>Categories</Link>
            <Link to="/#featured-products" onClick={handleNavigation}>Top rated</Link>
            <Link to="/#products" onClick={handleNavigation}>Products</Link>
            <Link to="/#about" onClick={handleNavigation}>Store info</Link>
            <div className="navbar__mobile-user">
              {renderUserSelector()}
            </div>
          </nav>

          <form
            className={`navbar__search${mobileSearchOpen ? ' is-open' : ''}`}
            role="search"
            onSubmit={handleSearch}
          >
            <SearchIcon />
            <input
              aria-label="Cari produk"
              type="search"
              placeholder="Cari produk yang kamu inginkan..."
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
            />
            <button type="submit" aria-label="Cari produk">
              <SearchIcon />
            </button>
          </form>

          <div className="navbar__actions">
            <button
              className="navbar__search-toggle"
              type="button"
              aria-label={mobileSearchOpen ? 'Tutup pencarian' : 'Buka pencarian'}
              aria-expanded={mobileSearchOpen}
              onClick={() => {
                setMobileSearchOpen((open) => !open)
                setMobileMenuOpen(false)
              }}
            >
              <SearchIcon />
            </button>
            {renderUserSelector()}
            <Link
              className="navbar__cart"
              to="/cart"
              aria-label={cartError ? 'Keranjang' : `Keranjang, ${cartCount} item`}
              title={cartError ? 'Jumlah keranjang tidak tersedia' : undefined}
            >
              <BagIcon />
              <span>Keranjang</span>
              <span className="navbar__cart-count" aria-hidden="true">
                {cartError ? '—' : cartCount > 99 ? '99+' : cartCount}
              </span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navbar
