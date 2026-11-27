import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { getProductsWithRating } from '../api/aggregate.js'
import AsyncView from '../components/AsyncView.jsx'
import ProductCard from '../components/ProductCard.jsx'
import ProductImage from '../components/ProductImage.jsx'
import { useAsync } from '../hooks/useAsync.js'
import { getProductCategories, getProductCategory } from '../utils/catalog.js'
import { formatRupiah } from '../utils/format.js'

const FILTERS = [
  { id: 'all', label: 'Semua produk' },
  { id: 'available', label: 'Stok tersedia' },
  { id: 'rated', label: 'Sudah memiliki rating' },
]

const UPCOMING_CATEGORIES = [
  {
    label: 'Smartphone',
    image: '/assets/categories/smartphone.jpg',
    imageAlt: 'Foto smartphone modern',
  },
  {
    label: 'Laptop',
    image: '/assets/categories/laptop.jpg',
    imageAlt: 'Foto laptop modern',
  },
  {
    label: 'Tablet',
    image: '/assets/categories/tablet.jpg',
    imageAlt: 'Foto tablet',
  },
  {
    label: 'Gaming',
    image: '/assets/categories/gaming.jpg',
    imageAlt: 'Foto controller gaming',
  },
  {
    label: 'Kamera',
    image: '/assets/categories/camera.jpg',
    imageAlt: 'Foto kamera digital',
  },
  {
    label: 'Smartwatch',
    image: '/assets/categories/smartwatch.jpg',
    imageAlt: 'Foto smartwatch',
  },
]

function ProductSection({
  title,
  description,
  products,
  userId,
  id,
  featured = false,
  viewAll = false,
}) {
  return (
    <section className="catalog-section" id={id}>
      <div className="section-heading">
        <div>
          <p className="eyebrow">{featured ? 'Paling banyak disukai' : 'Katalog ADUL SHOP'}</p>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        {viewAll ? (
          <Link className="section-heading__link" to="/shop">
            Lihat katalog <span aria-hidden="true">→</span>
          </Link>
        ) : (
          <span className="section-heading__count">{products.length} produk</span>
        )}
      </div>
      <div className="product-grid">
        {products.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            userId={userId}
            featured={featured && index === 0}
          />
        ))}
      </div>
    </section>
  )
}

function BenefitIcon({ type }) {
  const paths = {
    catalog: <><path d="M4 5.5h16v13H4z" /><path d="M8 9h8M8 13h5" /></>,
    reviews: <><path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" /></>,
    cart: <><path d="M3 4h2l2.2 11.1a2 2 0 0 0 2 1.6h8.5a2 2 0 0 0 1.9-1.4L21 8H6" /><circle cx="10" cy="20" r="1" /><circle cx="18" cy="20" r="1" /></>,
    price: <><path d="M12 3v18M17 7.5c0-1.4-1.7-2.5-4-2.5S9 6.1 9 7.5 10.8 10 13 10s4 1.1 4 2.5-1.8 2.5-4 2.5-4-1.1-4-2.5" /></>,
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {paths[type]}
    </svg>
  )
}

function ProductListPage({ searchQuery, userId, isCatalogPage }) {
  const { loading, data, error, reload } = useAsync(getProductsWithRating, [])
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeFilter, setActiveFilter] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get('category') || 'all',
  )
  const [minimumPrice, setMinimumPrice] = useState('')
  const [maximumPrice, setMaximumPrice] = useState('')
  const [minimumRating, setMinimumRating] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [heroIndex, setHeroIndex] = useState(0)
  const navigate = useNavigate()
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase('id-ID')
  const categories = useMemo(
    () => getProductCategories(data ?? []),
    [data],
  )

  useEffect(() => {
    const category = searchParams.get('category')
    setSelectedCategory(
      category && categories.includes(category) ? category : 'all',
    )
  }, [categories, searchParams])

  const heroProducts = useMemo(() => {
    const products = data ?? []
    return [...products]
      .sort(
        (first, second) => {
          const firstIsMonitor = /monitor/i.test(first.name)
          const secondIsMonitor = /monitor/i.test(second.name)
          if (firstIsMonitor !== secondIsMonitor) {
            return firstIsMonitor ? -1 : 1
          }
          return (
            Number(second.total_reviews ?? 0) -
              Number(first.total_reviews ?? 0) ||
            Number(second.average_rating ?? 0) -
              Number(first.average_rating ?? 0)
          )
        },
      )
      .slice(0, 5)
  }, [data])
  const heroProduct = heroProducts.length
    ? heroProducts[heroIndex % heroProducts.length]
    : null

  const visibleProducts = useMemo(() => {
    const products = data ?? []
    const filtered = products.filter((product) => {
      const matchesQuery =
        !normalizedQuery ||
        `${product.name} ${product.description ?? ''}`
          .toLocaleLowerCase('id-ID')
          .includes(normalizedQuery)
      const matchesCategory =
        selectedCategory === 'all' ||
        getProductCategory(product) === selectedCategory
      const price = Number(product.price)
      const matchesPrice =
        (!minimumPrice || price >= Number(minimumPrice)) &&
        (!maximumPrice || price <= Number(maximumPrice))
      const matchesRating =
        !minimumRating ||
        (Number(product.total_reviews) > 0 &&
          Number(product.average_rating) >= Number(minimumRating))
      const matchesFilter =
        activeFilter === 'all' ||
        (activeFilter === 'available' && product.stock > 0) ||
        (activeFilter === 'rated' &&
          product.average_rating !== null &&
          product.average_rating !== undefined &&
          Number(product.total_reviews) > 0)

      return (
        matchesQuery &&
        matchesCategory &&
        matchesPrice &&
        matchesRating &&
        matchesFilter
      )
    })
    return filtered.sort((first, second) => {
      if (sortBy === 'price-low') {
        return Number(first.price) - Number(second.price)
      }
      if (sortBy === 'price-high') {
        return Number(second.price) - Number(first.price)
      }
      if (sortBy === 'rating') {
        return (
          Number(second.average_rating ?? 0) -
          Number(first.average_rating ?? 0)
        )
      }
      return (
        new Date(second.created_at ?? 0).getTime() -
        new Date(first.created_at ?? 0).getTime()
      )
    })
  }, [
    activeFilter,
    data,
    maximumPrice,
    minimumPrice,
    minimumRating,
    normalizedQuery,
    selectedCategory,
    sortBy,
  ])

  const bestSellerProducts = useMemo(
    () =>
      [...visibleProducts].sort(
        (first, second) =>
          Number(second.total_reviews ?? 0) - Number(first.total_reviews ?? 0) ||
          Number(second.average_rating ?? 0) - Number(first.average_rating ?? 0) ||
          new Date(second.created_at ?? 0).getTime() -
            new Date(first.created_at ?? 0).getTime(),
      ),
    [visibleProducts],
  )

  const isFiltering =
    Boolean(normalizedQuery) ||
    activeFilter !== 'all' ||
    selectedCategory !== 'all' ||
    Boolean(minimumPrice) ||
    Boolean(maximumPrice) ||
    Boolean(minimumRating) ||
    sortBy !== 'newest'
  function resetFilters() {
    setActiveFilter('all')
    setSelectedCategory('all')
    setMinimumPrice('')
    setMaximumPrice('')
    setMinimumRating('')
    setSortBy('newest')
    setSearchParams({}, { replace: true })
  }

  function chooseCategory(category) {
    navigate({
      pathname: '/shop',
      search: `?category=${encodeURIComponent(category)}`,
      hash: '#products',
    })
  }

  return (
    <main className={`page ${isCatalogPage ? 'catalog-page' : 'home-page'}`}>
      {!isCatalogPage && <section className="hero hero--storefront" aria-labelledby="hero-title">
        <div className="hero__copy">
          <p className="hero__eyebrow">
            <span aria-hidden="true" /> ADUL SHOP · ELECTRONICS &amp; ACCESSORIES
          </p>
          <h1 id="hero-title">Tech that <span>powers</span> your life.</h1>
          <p className="hero__description">
            Temukan perangkat pilihan, bandingkan spesifikasi dan harga, lalu
            baca ulasan pelanggan sebelum membeli.
          </p>
          <a className="button button--primary hero__button" href="#products">
            SHOP NOW <span aria-hidden="true">→</span>
          </a>
        </div>
        <div className="hero__product-stage" aria-label="Pilihan produk dari katalog ADUL SHOP">
          {heroProduct ? (
            <article className="hero-feature">
              <div className="hero-feature__collage" aria-label="Foto produk dari katalog">
                {heroProducts.map((product, index) => (
                  <Link
                    className={`hero-feature__tile${product.id === heroProduct.id ? ' is-active' : ''}`}
                    key={product.id}
                    to={`/products/${product.id}`}
                    aria-label={`Lihat detail ${product.name}`}
                  >
                    <ProductImage
                      image={product.image}
                      name={product.name}
                      loading={index < 2 ? 'eager' : 'lazy'}
                      preferLocal
                    />
                  </Link>
                ))}
              </div>
              <div className="hero-feature__details">
                <div>
                  <span>{getProductCategory(heroProduct)} · Dari katalog</span>
                  <Link to={`/products/${heroProduct.id}`}>{heroProduct.name}</Link>
                  <strong>{formatRupiah(heroProduct.price)}</strong>
                </div>
                <Link
                  className="hero-feature__link"
                  to={`/products/${heroProduct.id}`}
                  aria-label={`Buka ${heroProduct.name}`}
                >
                  <span aria-hidden="true">↗</span>
                </Link>
              </div>
              {heroProducts.length > 1 && (
                <div className="hero-feature__pagination" aria-label="Pilih produk unggulan">
                  {heroProducts.map((product, index) => (
                    <button
                      className={index === heroIndex % heroProducts.length ? 'is-active' : ''}
                      key={product.id}
                      type="button"
                      aria-label={`Tampilkan ${product.name}`}
                      aria-pressed={index === heroIndex % heroProducts.length}
                      onClick={() => setHeroIndex(index)}
                    />
                  ))}
                </div>
              )}
            </article>
          ) : (
            <div className="hero-feature hero-feature--empty">
              <span>Produk unggulan akan tampil setelah katalog tersedia.</span>
            </div>
          )}
        </div>
      </section>}

      {!isCatalogPage && <section className="store-benefits" aria-label="Informasi layanan toko">
        <article>
          <span><BenefitIcon type="catalog" /></span>
          <div><strong>Data katalog</strong><small>Nama, harga, dan stok produk</small></div>
        </article>
        <article>
          <span><BenefitIcon type="reviews" /></span>
          <div><strong>Ulasan pelanggan</strong><small>Rating dari data ulasan</small></div>
        </article>
        <article>
          <span><BenefitIcon type="cart" /></span>
          <div><strong>Keranjang aktif</strong><small>Kelola pilihan produkmu</small></div>
        </article>
        <article>
          <span><BenefitIcon type="price" /></span>
          <div><strong>Harga dalam Rupiah</strong><small>Sesuai katalog produk</small></div>
        </article>
      </section>}

      {!isCatalogPage && categories.length > 0 && (
        <nav className="quick-categories" aria-label="Jelajahi kategori produk">
          {categories.map((category) => {
            const product = (data ?? []).find(
              (item) => getProductCategory(item) === category,
            )

            return (
              <button
                className="quick-category"
                key={category}
                type="button"
                onClick={() => chooseCategory(category)}
              >
                {product && (
                  <ProductImage
                    image={product.image}
                    name={product.name}
                    className="quick-category__image"
                    preferLocal
                  />
                )}
                <span className="quick-category__copy">
                  <strong>{category}</strong>
                  <small>Shop now <span aria-hidden="true">→</span></small>
                </span>
              </button>
            )
          })}
        </nav>
      )}

      {!isCatalogPage && categories.length > 0 && (
        <section
          className="category-showcase"
          id="category-showcase"
          aria-labelledby="category-title"
        >
          <div className="showcase-heading">
            <div>
              <p className="eyebrow">Jelajahi pilihan</p>
              <h2 id="category-title">Popular categories</h2>
            </div>
            <a href="#products">VIEW ALL <span aria-hidden="true">→</span></a>
          </div>
          <div className="category-showcase__grid">
            {categories.map((category) => {
              const product = (data ?? []).find(
                (item) => getProductCategory(item) === category,
              )

              return (
                <button
                  className="category-tile"
                  key={category}
                  type="button"
                  onClick={() => chooseCategory(category)}
                >
                  {product ? (
                    <ProductImage
                      image={product.image}
                      name={product.name}
                      className="category-tile__image"
                      preferLocal
                    />
                  ) : (
                    <span className="category-tile__empty" aria-hidden="true">◇</span>
                  )}
                  <strong>{category}</strong>
                  <span>SHOP NOW <span aria-hidden="true">→</span></span>
                </button>
              )
            })}
            {UPCOMING_CATEGORIES.map(({ label, image, imageAlt }) => (
              <article className="category-tile category-tile--upcoming" key={label}>
                <img
                  className="category-tile__photo"
                  src={image}
                  alt={imageAlt}
                  loading="lazy"
                  decoding="async"
                />
                <strong>{label}</strong>
                <span className="category-tile__status">SEGERA HADIR</span>
              </article>
            ))}
          </div>
          <p className="category-showcase__note">
            Kategori baru belum memiliki produk, harga, atau stok di katalog toko.
          </p>
        </section>
      )}

      {isCatalogPage && (
        <header className="shop-header">
          <p className="eyebrow">ADUL SHOP · KATALOG</p>
          <h1>Temukan perangkat yang tepat</h1>
          <p>Gunakan pencarian dan filter untuk menjelajahi produk yang tersedia.</p>
        </header>
      )}

      <section className={`catalog${isCatalogPage ? ' catalog--shop' : ''}`} id="products" aria-label="Katalog produk">
        <div className="catalog__intro">
          <div>
            <p className="eyebrow">{isCatalogPage ? 'Produk tersedia' : 'Pilihan dari katalog'}</p>
            <h2>{isCatalogPage ? 'Semua produk' : 'Paling banyak diulas'}</h2>
            <p>{isCatalogPage ? 'Filter berdasarkan kategori, harga, dan rating.' : 'Urutan mengikuti jumlah ulasan yang tersedia.'}</p>
          </div>
          {isCatalogPage && <div className="catalog-controls" id="category-filters">
            <div className="catalog-filters" aria-label="Filter ketersediaan">
              {FILTERS.map((filter) => (
                <button
                  className={`catalog-filters__button${activeFilter === filter.id ? ' is-active' : ''}`}
                  key={filter.id}
                  type="button"
                  aria-pressed={activeFilter === filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <label className="catalog-control">
              <span>Kategori</span>
              <select
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
              >
                <option value="all">Semua kategori</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <fieldset className="catalog-price-filter">
              <legend>Rentang harga</legend>
              <label>
                <span>Minimum (Rp)</span>
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  placeholder="Tanpa batas"
                  value={minimumPrice}
                  onChange={(event) => setMinimumPrice(event.target.value)}
                />
              </label>
              <label>
                <span>Maksimum (Rp)</span>
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  placeholder="Tanpa batas"
                  value={maximumPrice}
                  onChange={(event) => setMaximumPrice(event.target.value)}
                />
              </label>
            </fieldset>
            <label className="catalog-control">
              <span>Rating</span>
              <select
                value={minimumRating}
                onChange={(event) => setMinimumRating(event.target.value)}
              >
                <option value="">Semua rating</option>
                <option value="3">Minimal 3 bintang</option>
                <option value="4">Minimal 4 bintang</option>
              </select>
            </label>
            <label className="catalog-control">
              <span>Urutkan</span>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
              >
                <option value="newest">Terbaru</option>
                <option value="price-low">Harga terendah</option>
                <option value="price-high">Harga tertinggi</option>
                <option value="rating">Rating tertinggi</option>
              </select>
            </label>
            {isFiltering && (
              <button
                className="catalog-reset"
                type="button"
                onClick={resetFilters}
              >
                Hapus filter
              </button>
            )}
          </div>}
        </div>

        <AsyncView loading={loading} error={error} reload={reload}>
          {visibleProducts.length ? (
            <ProductSection
              id={isFiltering ? 'product-results' : isCatalogPage ? 'product-results' : 'featured-products'}
              title={isFiltering ? 'Produk sesuai pilihan' : isCatalogPage ? 'Katalog ADUL SHOP' : 'Paling banyak diulas'}
              description={
                isFiltering
                  ? `${visibleProducts.length} produk ditemukan dari katalog toko.`
                  : isCatalogPage
                    ? `${visibleProducts.length} produk tersedia.`
                    : 'Produk diurutkan berdasarkan jumlah ulasan pelanggan yang tersedia.'
              }
              products={isFiltering ? visibleProducts : bestSellerProducts}
              userId={userId}
              featured={!isFiltering}
              viewAll={!isCatalogPage}
            />
          ) : (
            <div className="empty-state empty-state--catalog">
              <span aria-hidden="true">⌕</span>
              <h3>
                {data?.length
                  ? 'Produk tidak ditemukan'
                  : 'Belum ada produk untuk ditampilkan'}
              </h3>
              <p>
                {data?.length
                  ? 'Coba kata pencarian atau filter yang berbeda.'
                  : 'Produk akan tampil di sini setelah tersedia di katalog.'}
              </p>
            </div>
          )}
        </AsyncView>
        <p className="product-disclaimer">
          Foto yang tampil merupakan referensi kategori; merek dan model spesifik
          ditampilkan hanya jika tersedia pada data produk.
        </p>
      </section>

      {!isCatalogPage && <section className="store-about" id="about">
        <div className="store-about__copy">
          <p className="eyebrow">Tentang toko</p>
          <h2>Belanja dengan informasi yang jelas</h2>
          <p>
            Nama, deskripsi, harga, dan stok berasal dari katalog produk.
            Ulasan pelanggan dan rating ditampilkan dari layanan ulasan yang
            tersedia.
          </p>
          <Link className="button button--secondary" to="/shop">
            Lihat katalog
          </Link>
        </div>
      </section>}

    </main>
  )
}

export default ProductListPage
