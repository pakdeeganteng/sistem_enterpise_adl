import { useState } from 'react'
import { createReview } from '../api/reviewApi.js'
import { describeError } from '../utils/format.js'
import './components.css'

function ReviewForm({ productId, userId, onCreated }) {
  const [rating, setRating] = useState('5')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    const trimmedComment = comment.trim()
    if (!trimmedComment) {
      setError(new Error('Tulis komentar sebelum mengirim ulasan.'))
      return
    }

    setSubmitting(true)
    setError(null)
    setMessage('')

    try {
      const result = await createReview({
        productId,
        userId,
        rating: Number(rating),
        comment: trimmedComment,
      })
      setComment('')
      if (onCreated) {
        await onCreated(result.data)
      }
      setMessage('Ulasan berhasil dikirim dan sudah ditampilkan.')
    } catch (submitError) {
      setError(submitError)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="review-form" onSubmit={handleSubmit}>
      <fieldset className="review-form__rating">
        <legend>Penilaian</legend>
        <div className="review-form__stars" aria-label="Pilih rating dari 1 sampai 5">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              aria-label={`${value} dari 5 bintang`}
              aria-pressed={Number(rating) === value}
              className={
                Number(rating) >= value
                  ? 'review-form__star is-selected'
                  : 'review-form__star'
              }
              key={value}
              onClick={() => setRating(String(value))}
              type="button"
            >
              ★
            </button>
          ))}
        </div>
        <span>{rating} dari 5</span>
      </fieldset>

      <label className="review-form__field">
        Komentar
        <textarea
          rows={3}
          required
          maxLength={1000}
          minLength={1}
          aria-describedby="review-comment-help"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
        />
        <small id="review-comment-help">
          {comment.length}/1000 karakter
        </small>
      </label>

      {error && (
        <p className="review-form__error" role="alert">
          {describeError(error)}
        </p>
      )}
      {message && (
        <p className="review-form__success" role="status">
          {message}
        </p>
      )}

      <button type="submit" disabled={submitting}>
        {submitting ? 'Mengirim...' : 'Kirim ulasan'}
      </button>
    </form>
  )
}

export default ReviewForm
