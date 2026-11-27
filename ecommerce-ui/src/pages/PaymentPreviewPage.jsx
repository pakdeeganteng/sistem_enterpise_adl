import { Link } from 'react-router-dom'
import { getCartDetail } from '../api/aggregate.js'
import AsyncView from '../components/AsyncView.jsx'
import CheckoutSteps from '../components/CheckoutSteps.jsx'
import { useAsync } from '../hooks/useAsync.js'
import { formatRupiah } from '../utils/format.js'

function PaymentPreviewPage({ userId }) {
  const { loading, data, error, reload } = useAsync(
    () => getCartDetail(userId),
    [userId],
  )

  return (
    <main className="page payment-page">
      <CheckoutSteps current="payment" />
      <header className="page-header">
        <p className="eyebrow">Langkah terakhir</p>
        <h1>Pembayaran</h1>
        <p>Periksa ringkasan belanja sebelum integrasi pembayaran tersedia.</p>
      </header>

      <div className="preview-notice" role="note">
        <strong>Pembayaran belum tersedia.</strong>
        <span>
          Belum ada payment gateway yang terhubung. Tidak ada pembayaran atau
          pesanan yang dapat diproses dari halaman ini.
        </span>
      </div>

      <AsyncView loading={loading} error={error} reload={reload}>
        {data && (
          data.items.length ? (
            <section className="payment-preview" aria-labelledby="payment-preview-title">
              <div className="payment-preview__header">
                <div>
                  <p className="eyebrow">Ringkasan pesanan</p>
                  <h2 id="payment-preview-title">Belanjaanmu</h2>
                </div>
                <Link className="payment-preview__edit" to="/cart">
                  Ubah keranjang
                </Link>
              </div>
              <div className="payment-preview__items">
                {data.items.map((item) => {
                  const name = item.product?.name || 'Produk tidak tersedia'

                  return (
                    <article className="payment-preview__item" key={item.id}>
                      <div>
                        <strong>{name}</strong>
                        <span>Jumlah {item.quantity}</span>
                      </div>
                      <strong>
                        {item.product
                          ? formatRupiah(Number(item.product.price) * item.quantity)
                          : 'Harga tidak tersedia'}
                      </strong>
                    </article>
                  )
                })}
              </div>
              <div className="payment-preview__notice">
                <div className="payment-preview__icon" aria-hidden="true">
                  <svg viewBox="0 0 48 48">
                    <rect x="5" y="10" width="38" height="28" rx="5" />
                    <path d="M5 19h38M12 30h10" />
                  </svg>
                </div>
                <div>
                  <h3>Metode pembayaran belum tersedia</h3>
                  <p>
                    Payment gateway belum terhubung. Halaman ini hanya pratinjau;
                    tidak ada pembayaran atau pesanan yang diproses.
                  </p>
                </div>
              </div>
              <div className="payment-preview__total">
                <span>Total keranjang saat ini</span>
                <strong>{formatRupiah(data.totalPrice)}</strong>
              </div>
              {data.items.some((item) => !item.product) && (
                <p className="payment-preview__disclaimer">
                  Sebagian produk tidak dapat dimuat, sehingga total belum mencakup harganya.
                </p>
              )}
              <div className="payment-preview__actions">
                <Link className="button button--secondary" to="/checkout">
                  Kembali ke checkout
                </Link>
                <Link className="button button--primary" to="/shop">
                  Lanjut belanja
                </Link>
              </div>
            </section>
          ) : (
            <section className="payment-preview payment-preview--empty">
              <div className="payment-preview__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M3 3h2l2.2 11.1a2 2 0 0 0 2 1.6h8.5a2 2 0 0 0 1.9-1.4L21 8H6" />
                  <circle cx="10" cy="20" r="1" />
                  <circle cx="18" cy="20" r="1" />
                </svg>
              </div>
              <h2>Keranjangmu masih kosong</h2>
              <p>Tambahkan produk ke keranjang sebelum melihat ringkasan pembayaran.</p>
              <div className="payment-preview__actions">
                <Link className="button button--primary" to="/shop">
                  Cari produk
                </Link>
                <Link className="button button--secondary" to="/cart">
                  Kembali ke keranjang
                </Link>
              </div>
            </section>
          )
        )}
      </AsyncView>
    </main>
  )
}

export default PaymentPreviewPage