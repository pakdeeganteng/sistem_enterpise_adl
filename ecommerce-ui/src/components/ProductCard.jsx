import { useState } from 'react'
import { Link } from 'react-router-dom'
import { addToCart } from '../api/cartApi.js'
import { getProductCategory } from '../utils/catalog.js'
import { notifyCartUpdated } from '../utils/cartEvents.js'
import { describeError, formatRupiah } from '../utils/format.js'
import ProductImage from './ProductImage.jsx'
import StarRating from './StarRating.jsx'
import './components.css'

function ProductCard({ product, userId, featured = false }) {
  const hasRating =
    product.average_rating !== null &&
    product.average_rating !== undefined &&
    Number(product.total_reviews) > 0
  const [adding, setAdding] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState(null)

  async function handleAddToCart() {
    setAdding(true)
    setMessage('')
    setError(null)

    try {
      await addToCart(userId, product.id, 1)
      notifyCartUpdated()
      setMessage('Ditambahkan ke keranjang.')
    } catch (requestError) {
      setError(requestError)
    } finally {
      setAdding(false)
    }
  }

  return (
    <article className="product-card">
      <Link
        className="product-card__image-link"
        to={`/products/${product.id}`}
        aria-label={`Lihat ${product.name}`}
      >
        <ProductImage image={product.image} name={product.name} preferLocal />
        {featured && (
          <span className="product-card__featured-badge">Unggulan</span>
        )}
        <span
          className={`product-card__image-badge${product.stock > 0 ? ' is-available' : ''}`}
        >
          {product.stock > 0 ? 'Tersedia' : 'Habis'}
        </span>
      </Link>
      <div className="product-card__content">
        <span className="product-card__category">
          {getProductCategory(product)}
        </span>
        <div className="product-card__meta">
          <span>{product.stock > 0 ? `Stok ${product.stock}` : 'Stok habis'}</span>
          {product.rating_unavailable ? (
            <p className="product-card__rating-empty">Rating tidak tersedia</p>
          ) : (
            <StarRating
              rating={hasRating ? product.average_rating : null}
              count={product.total_reviews}
              compact
            />
          )}
          {hasRating && (
            <span className="product-card__review-count">
              ({Number(product.total_reviews)})
            </span>
          )}
        </div>
        <h2>
          <Link className="product-card__link" to={`/products/${product.id}`}>
            {product.name}
          </Link>
        </h2>
        <p className="product-card__price">{formatRupiah(product.price)}</p>
        <div className="product-card__actions">
          <Link className="button button--secondary" to={`/products/${product.id}`}>
            Lihat detail
          </Link>
          <button
            className="button button--primary"
            type="button"
            onClick={handleAddToCart}
            disabled={adding || product.stock < 1}
          >
            {adding ? 'Menambahkan...' : 'Tambah'}
          </button>
        </div>
        {message && (
          <p className="product-card__feedback success-message" role="status">
            {message}
          </p>
        )}
        {error && (
          <p className="product-card__feedback error-message" role="alert">
            {describeError(error)}
          </p>
        )}
      </div>
    </article>
  )
}

export default ProductCard
