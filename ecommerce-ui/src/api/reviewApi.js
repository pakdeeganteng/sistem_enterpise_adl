import { request } from './http.js'

const REVIEW_URL = import.meta.env.VITE_REVIEW_URL

export function getProductReviews(productId) {
  return request(
    `${REVIEW_URL}/reviews/product/${encodeURIComponent(productId)}`,
  )
}

export function createReview({ productId, userId, rating, comment }) {
  return request(`${REVIEW_URL}/reviews`, {
    method: 'POST',
    body: {
      product_id: productId,
      user_id: userId,
      rating,
      comment,
    },
  })
}
