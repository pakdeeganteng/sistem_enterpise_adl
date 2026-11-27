import { request } from './http.js'

const CART_URL = import.meta.env.VITE_CART_URL

export function getCart(userId) {
  return request(`${CART_URL}/carts/${encodeURIComponent(userId)}`)
}

export function addToCart(userId, productId, quantity) {
  return request(`${CART_URL}/carts`, {
    method: 'POST',
    body: {
      user_id: userId,
      product_id: productId,
      quantity,
    },
  })
}

export function updateCartItem(itemId, quantity) {
  return request(`${CART_URL}/carts/items/${encodeURIComponent(itemId)}`, {
    method: 'PUT',
    body: { quantity },
  })
}

export function removeCartItem(itemId) {
  return request(`${CART_URL}/carts/items/${encodeURIComponent(itemId)}`, {
    method: 'DELETE',
  })
}

export function clearCart(userId) {
  return request(`${CART_URL}/carts/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  })
}
