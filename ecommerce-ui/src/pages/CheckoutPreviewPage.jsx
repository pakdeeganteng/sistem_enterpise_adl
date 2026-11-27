import { Link } from 'react-router-dom'
import { getCartDetail } from '../api/aggregate.js'
import AsyncView from '../components/AsyncView.jsx'
import CheckoutSteps from '../components/CheckoutSteps.jsx'
import ProductImage from '../components/ProductImage.jsx'
import { useAsync } from '../hooks/useAsync.js'
import { formatRupiah } from '../utils/format.js'

function CheckoutPreviewPage({ userId }) {
  const { loading, data, error, reload } = useAsync(
    () => getCartDetail(userId),
    [userId],
  )

  return (
    <main className="page checkout-page">
      <CheckoutSteps current="checkout" />
      <header className="page-header">
        <p className="eyebrow">Pratinjau checkout</p>
        <h1>Periksa pesananmu</h1>
        <p>Pastikan pilihan produkmu sudah benar sebelum melanjutkan.</p>
      </header>

      <div className="preview-notice" role="note">
        <strong>Checkout belum terhubung.</strong>
        <span>
          Ini pratinjau tampilan. Belum ada pesanan atau transaksi yang dibuat.
        </span>
      </div>

      <AsyncView loading={loading} error={error} reload={reload}>
        {data && (
          <div className="checkout-layout">
            <section className="checkout-panel">
              <div className="checkout-panel__heading">
                <h2>Produk di keranjang</h2>
                <Link to="/cart">Ubah keranjang</Link>
              </div>
              {data.items.length ? (
                <div className="checkout-items">
                  {data.items.map((item) => {
                    const name = item.product?.name || 'Produk tidak tersedia'
                    return (
                      <article className="checkout-item" key={item.id}>
                        <ProductImage
                          className="product-image--checkout"
                          image={item.product?.image}
                          name={name}
                        />
                        <div>
                          <strong>{name}</strong>
                          <span>
                            Jumlah {item.quantity}
                            {item.product &&
                              ` · ${formatRupiah(item.product.price)} / item`}
                          </span>
                        </div>
                        <strong>
                          {formatRupiah(
                            item.product
                              ? Number(item.product.price) * item.quantity
                              : 0,
                          )}
                        </strong>
                      </article>
                    )
                  })}
                </div>
              ) : (
                <div className="empty-state checkout-empty">
                  <h3>Keranjang masih kosong</h3>
                  <p>Tambahkan produk sebelum melanjutkan.</p>
                  <Link className="button button--secondary" to="/shop">
                    Cari produk
                  </Link>
                </div>
              )}
            </section>

            <aside className="checkout-summary">
              <p className="eyebrow">Ringkasan</p>
              <div className="cart-summary__row">
                <span>Subtotal produk</span>
                <span>{formatRupiah(data.totalPrice)}</span>
              </div>
              <div className="cart-summary__total">
                <span>Total</span>
                <strong>{formatRupiah(data.totalPrice)}</strong>
              </div>
              <Link
                className="button button--primary checkout-summary__continue"
                to="/payment"
              >
                Lanjut ke pratinjau payment
              </Link>
              <p className="cart-summary__note">
                Tidak ada data pembayaran yang akan dikirim.
              </p>
            </aside>
          </div>
        )}
      </AsyncView>
    </main>
  )
}

export default CheckoutPreviewPage
