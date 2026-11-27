import { Link } from 'react-router-dom'
import './components.css'

const STEPS = [
  { id: 'cart', label: 'Keranjang', to: '/cart' },
  { id: 'checkout', label: 'Checkout', to: '/checkout' },
  { id: 'payment', label: 'Pembayaran', to: '/payment' },
]

function CheckoutSteps({ current }) {
  const currentIndex = STEPS.findIndex((step) => step.id === current)

  return (
    <nav className="checkout-steps" aria-label="Tahapan belanja">
      {STEPS.map((step, index) => {
        const isCurrent = step.id === current
        const isComplete = index < currentIndex
        return (
          <div
            className={`checkout-steps__item${isCurrent ? ' is-current' : ''}${isComplete ? ' is-complete' : ''}`}
            key={step.id}
          >
            {isComplete ? (
              <Link to={step.to} aria-current={isCurrent ? 'step' : undefined}>
                <span className="checkout-steps__marker" aria-hidden="true">
                  ✓
                </span>
                <span>{step.label}</span>
              </Link>
            ) : (
              <Link
                to={step.to}
                aria-current={isCurrent ? 'step' : undefined}
                className={isCurrent ? 'is-current' : ''}
              >
                <span className="checkout-steps__marker" aria-hidden="true">
                  {index + 1}
                </span>
                <span>{step.label}</span>
              </Link>
            )}
            {index < STEPS.length - 1 && (
              <span className="checkout-steps__connector" aria-hidden="true">
                ›
              </span>
            )}
          </div>
        )
      })}
    </nav>
  )
}

export default CheckoutSteps
