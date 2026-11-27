import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  clearCart,
  removeCartItem,
  updateCartItem,
} from '../api/cartApi.js'
import { getCartDetail } from '../api/aggregate.js'
import AsyncView from '../components/AsyncView.jsx'
import CheckoutSteps from '../components/CheckoutSteps.jsx'
import ProductImage from '../components/ProductImage.jsx'
import { notifyCartUpdated } from '../utils/cartEvents.js'
import { useAsync } from '../hooks/useAsync.js'
import { describeError, formatRupiah } from '../utils/format.js'

function CartPage({ userId }) {
  const { loading, data, error, reload } = useAsync(
    () => getCartDetail(userId),
    [userId],
  )
  const [actionError, setActionError] = useState(null)
  const [actionPending, setActionPending] = useState(false)

  async function performAction(action) {
    setActionPending(true)
    setActionError(null)
    try {
      await action()
      notifyCartUpdated()
      reload()
    } catch (requestError) {
      setActionError(requestError)
    } finally {
      setActionPending(false)
    }
  }

  function changeQuantity(item) {
    if (item.quantity <= 1) {
      return performAction(() => removeCartItem(item.id))
    }
    return performAction(() =>
      updateCartItem(item.id, item.quantity - 1),
    )
  }

  return (
    <main className="page">
      <CheckoutSteps current="cart" />
      <header className="page-header">
        <p className="eyebrow">Belanja pilihanmu</p>
        <h1>Keranjang Belanja</h1>
        <p>Periksa produk dan jumlah sebelum melanjutkan.</p>
      </header>

      {actionError && (
        <p className="error-message" role="alert">
          {describeError(actionError)}
        </p>
      )}

      <AsyncView loading={loading} error={error} reload={reload}>
        {data?.items.length ? (
          <>
            <div className="cart-layout">
              <div className="cart-list">
                {data.items.map((item) => {
                  const subtotal = item.product
                    ? Number(item.product.price) * item.quantity
                    : 0
                  const productName = item.product?.name || 'Produk tidak tersedia'

                  return (
                    <article className="cart-item" key={item.id}>
                      <ProductImage
                        className="product-image--cart"
                        image={item.product?.image}
                        name={productName}
                      />
                      <div className="cart-item__details">
                        {item.product ? (
                          <Link to={`/products/${item.product.id}`}>
                            {item.product.name}
                          </Link>
                        ) : (
                          <strong>Produk tidak tersedia</strong>
                        )}
                        <p>
                          {item.product
                            ? formatRupiah(item.product.price)
                            : 'Harga tidak tersedia'}
                        </p>
                        <strong className="cart-item__subtotal">
                          Subtotal: {formatRupiah(subtotal)}
                        </strong>
                      </div>
                      <div className="cart-item__actions">
                        <div className="quantity-control" aria-label="Ubah jumlah">
                          <button
                            type="button"
                            aria-label={`Kurangi jumlah ${productName}`}
                            onClick={() => changeQuantity(item)}
                            disabled={actionPending}
                          >
                            −
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            type="button"
                            aria-label={`Tambah jumlah ${productName}`}
                            onClick={() =>
                              performAction(() =>
                                updateCartItem(item.id, item.quantity + 1),
                              )
                            }
                            disabled={
                              actionPending ||
                              (item.product &&
                                item.quantity >= item.product.stock)
                            }
                          >
                            +
                          </button>
                        </div>
                        <button
                          className="button button--text-danger"
                          type="button"
                          onClick={() =>
                            performAction(() => removeCartItem(item.id))
                          }
                          disabled={actionPending}
                        >
                          Hapus
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>

              <aside className="cart-summary">
                <p className="eyebrow">Ringkasan pesanan</p>
                <div className="cart-summary__row">
                  <span>{data.items.length} jenis produk</span>
                  <span>{formatRupiah(data.totalPrice)}</span>
                </div>
                <div className="cart-summary__total">
                  <span>Total harga</span>
                  <strong>{formatRupiah(data.totalPrice)}</strong>
                </div>
                <Link className="button button--primary cart-summary__continue" to="/checkout">
                  Lanjut ke checkout
                </Link>
                <Link className="button button--secondary cart-summary__continue" to="/shop">
                  Lanjut belanja
                </Link>
                <button
                  className="button button--text-danger"
                  type="button"
                  onClick={() => performAction(() => clearCart(userId))}
                  disabled={actionPending}
                >
                  {actionPending ? 'Memproses...' : 'Kosongkan keranjang'}
                </button>
                <p className="cart-summary__note">
                  Checkout/payment hanya pratinjau dan belum terhubung.
                </p>
              </aside>
            </div>
          </>
        ) : (
          <div className="empty-state empty-state--cart">
            <span aria-hidden="true">▱</span>
            <h2>Keranjangmu masih kosong</h2>
            <p>Yuk, temukan produk yang kamu suka.</p>
            <Link className="button button--primary" to="/shop">
              Mulai belanja
            </Link>
          </div>
        )}
      </AsyncView>
    </main>
  )
}

export default CartPage
