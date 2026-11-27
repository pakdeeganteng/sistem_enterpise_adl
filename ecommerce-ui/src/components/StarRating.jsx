import './components.css'

function StarRating({ rating, count = 0, compact = false }) {
  const hasRating = rating !== null && rating !== undefined
  const hasReviews = compact ? hasRating : Number(count) > 0
  const roundedRating = hasRating
    ? Math.max(0, Math.min(5, Math.round(Number(rating) || 0)))
    : 0
  const filledStars = '\u2605'.repeat(roundedRating)
  const emptyStars = '\u2605'.repeat(5 - roundedRating)

  return (
    <span
      className={`star-rating${compact ? ' star-rating--compact' : ''}`}
      aria-label={
        hasRating && hasReviews
          ? compact
            ? `Rating ${rating} dari 5`
            : `Rating ${rating} dari 5, ${count} ulasan`
          : 'Belum ada ulasan'
      }
    >
      <span className="star-rating__stars" aria-hidden="true">
        {filledStars}
        <span className="star-rating__empty">{emptyStars}</span>
      </span>
      {hasRating && hasReviews ? (
        <span>
          {Number(rating).toFixed(1)}
          {!compact && ` (${count} ulasan)`}
        </span>
      ) : (
        <span>Belum ada ulasan</span>
      )}
    </span>
  )
}

export default StarRating
