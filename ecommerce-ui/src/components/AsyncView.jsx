import { describeError } from '../utils/format.js'
import './components.css'

function AsyncView({ loading, error, reload, children }) {
  if (loading) {
    return (
      <div
        className="async-view async-view--loading"
        role="status"
        aria-live="polite"
      >
        <span className="async-view__loading-label">Memuat data toko...</span>
        <div className="loading-skeleton" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <section className="async-view" role="alert">
        <p className="async-view__error">{describeError(error)}</p>
        {reload && (
          <button
            className="async-view__retry"
            type="button"
            onClick={reload}
          >
            Coba lagi
          </button>
        )}
      </section>
    )
  }

  return children
}

export default AsyncView
