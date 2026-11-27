import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { addToCart } from '../api/cartApi.js'
import { getProductDetail } from '../api/aggregate.js'
import AsyncView from '../components/AsyncView.jsx'
import ProductImage from '../components/ProductImage.jsx'
import ReviewForm from '../components/ReviewForm.jsx'
import StarRating from '../components/StarRating.jsx'
import { getProductCategory } from '../utils/catalog.js'
import { notifyCartUpdated } from '../utils/cartEvents.js'
import { useAsync } from '../hooks/useAsync.js'
import {
  describeError,
  formatReviewDate,
  formatRupiah,
} from '../utils/format.js'

function ProductDetailPage({ userId }) {
  const { id } = useParams()
  const { loading, data, error, reload } = useAsync(
    () => getProductDetail(id),
    [id],
  )
  const [quantity, setQuantity] = useState('1')
  const [adding, setAdding] = useState(false)
  const [cartError, setCartError] = useState(null)
  const [cartMessage, setCartMessage] = useState('')
  const [submittedReview, setSubmittedReview] = useState(null)

  useEffect(() => {
    setSubmittedReview(null)
  }, [id])

  const serverReviews = data?.reviews?.reviews ?? []
  const reviews = serverReviews.filter((review) => {
    const rating = Number(review.rating)
    return Number.isFinite(rating) && rating >= 1 && rating <= 5
  })
  if (
    submittedReview?.product_id === Number(id) &&
    !reviews.some((review) => review.id === submittedReview.id)
  ) {
    reviews.push(submittedReview)
  }
  reviews.sort(
    (first, second) =>
      new Date(second.created_at).getTime() -
      new Date(first.created_at).getTime(),
  )

  const totalReviews = reviews.length
  const averageRating = totalReviews
    ? reviews.reduce((total, review) => total + Number(review.rating), 0) /
      totalReviews
    : null
  const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => {
    const count = reviews.filter(
      (review) => Math.round(Number(review.rating)) === rating,
    ).length
    return {
      rating,
      count,
      percentage: totalReviews ? (count / totalReviews) * 100 : 0,
    }
  })

  async function handleAddToCart() {
    setAdding(true)
    setCartError(null)
    setCartMessage('')

    try {
      const amount = Math.max(1, Number(quantity) || 1)
      await addToCart(userId, data.product.id, amount)
      notifyCartUpdated()
      setCartMessage('Produk berhasil dimasukkan ke keranjang.')
    } catch (requestError) {
      setCartError(requestError)
    } finally {
      setAdding(false)
    }
  }

  async function handleReviewCreated(review) {
    setSubmittedReview(review)
    reload()
  }

  return (
    <main className="page">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/">Beranda</Link>
        <span aria-hidden="true">/</span>
        <span>Detail produk</span>
      </nav>

      <AsyncView loading={loading} error={error} reload={reload}>
        {data && (
          <>
            <article className="detail-card">
              <div className="detail-card__image">
                <ProductImage
                  image={data.product.image}
                  name={data.product.name}
                  preferLocal
                />
              </div>
              <div className="detail-card__content">
                <p className="eyebrow">
                  {getProductCategory(data.product)} · ADUL SHOP
                </p>
                <h1>{data.product.name}</h1>
                {data.reviews && (
                  <StarRating
                    rating={
                      totalReviews > 0 ? averageRating : null
                    }
                    count={totalReviews}
                  />
                )}
                <p className="detail-card__price">
                  {formatRupiah(data.product.price)}
                </p>
                <p className="detail-card__description">
                  {data.product.description || 'Belum ada deskripsi produk.'}
                </p>
                <dl className="detail-card__facts">
                  <div>
                    <dt>Kategori</dt>
                    <dd>{getProductCategory(data.product)}</dd>
                  </div>
                  <div>
                    <dt>Ketersediaan</dt>
                    <dd>{data.product.stock > 0 ? 'Tersedia' : 'Stok habis'}</dd>
                  </div>
                </dl>
                <div className="detail-card__stock">
                  <span
                    className={
                      data.product.stock > 0
                        ? 'stock-indicator'
                        : 'stock-indicator stock-indicator--empty'
                    }
                  />
                  {data.product.stock > 0
                    ? `${data.product.stock} tersedia`
                    : 'Stok habis'}
                </div>

                <div className="add-to-cart">
                  <label htmlFor="product-quantity">Jumlah</label>
                  <input
                    id="product-quantity"
                    type="number"
                    min="1"
                    max={data.product.stock}
                    value={quantity}
                    onChange={(event) => setQuantity(event.target.value)}
                    disabled={data.product.stock < 1 || adding}
                  />
                  <button
                    className="button button--primary"
                    type="button"
                    onClick={handleAddToCart}
                    disabled={
                      adding ||
                      data.product.stock < 1 ||
                      quantity > data.product.stock
                    }
                  >
                    {adding ? 'Menambahkan...' : 'Tambah ke keranjang'}
                  </button>
                </div>
                {cartMessage && (
                  <p className="success-message" role="status">
                    {cartMessage}
                  </p>
                )}
                {cartError && (
                  <p className="error-message" role="alert">
                    {describeError(cartError)}
                  </p>
                )}
              </div>
            </article>

            <section className="reviews-section">
              <h2>
                Ulasan pelanggan <span>({totalReviews})</span>
              </h2>
              {data.reviews ? (
                <>
                  <div className="review-summary">
                    <div className="review-summary__score">
                      <strong>
                        {averageRating === null ? '—' : averageRating.toFixed(1)}
                      </strong>
                      <StarRating
                        rating={averageRating}
                        count={totalReviews}
                        compact
                      />
                      <span>
                        {totalReviews} ulasan dari layanan ulasan
                      </span>
                    </div>
                    <div
                      className="review-summary__distribution"
                      aria-label="Distribusi rating"
                    >
                      {ratingDistribution.map(({ rating, count, percentage }) => (
                        <div className="rating-distribution__row" key={rating}>
                          <span>{rating} bintang</span>
                          <span
                            className="rating-distribution__track"
                            aria-hidden="true"
                          >
                            <span style={{ width: `${percentage}%` }} />
                          </span>
                          <span>{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {reviews.length ? (
                    <ul className="review-list">
                      {reviews.map((review) => (
                        <li className="review-card" key={review.id}>
                          <div className="review-card__header">
                            <div>
                              <strong>Pengguna #{review.user_id}</strong>
                              <StarRating rating={review.rating} compact />
                            </div>
                            <time dateTime={review.created_at}>
                              {formatReviewDate(review.created_at)}
                            </time>
                          </div>
                          <p>{review.comment || 'Tanpa komentar.'}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="empty-state">
                      Belum ada ulasan untuk produk ini.
                    </p>
                  )}
                </>
              ) : (
                <p className="error-message">
                  Ulasan tidak dapat dimuat saat ini.
                </p>
              )}

              <h3>Tulis ulasan</h3>
              <ReviewForm
                productId={data.product.id}
                userId={userId}
                onCreated={handleReviewCreated}
              />
            </section>

            <section className="related-products" aria-labelledby="related-title">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Lihat juga</p>
                  <h2 id="related-title">Produk terkait</h2>
                </div>
                <Link to="/shop">Jelajahi katalog</Link>
              </div>
              {data.relatedProductsUnavailable ? (
                <p className="related-products__notice">
                  Produk terkait tidak dapat dimuat saat ini.
                </p>
              ) : data.relatedProducts.length ? (
                <div className="related-products__grid">
                  {data.relatedProducts.map((product) => (
                    <Link
                      className="related-product"
                      key={product.id}
                      to={`/products/${product.id}`}
                    >
                      <ProductImage
                        image={product.image}
                        name={product.name}
                        preferLocal
                      />
                      <span>{product.name}</span>
                      <strong>{formatRupiah(product.price)}</strong>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="related-products__notice">
                  Belum ada produk terkait lainnya di katalog.
                </p>
              )}
            </section>
          </>
        )}
      </AsyncView>
    </main>
  )
}

export default ProductDetailPage
