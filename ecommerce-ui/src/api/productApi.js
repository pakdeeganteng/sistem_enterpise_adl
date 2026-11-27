import { request } from './http.js'

const PRODUCT_URL = import.meta.env.VITE_PRODUCT_URL

export function getProducts() {
  return request(`${PRODUCT_URL}/catalog`)
}

export function getProduct(id) {
  return request(`${PRODUCT_URL}/products/${encodeURIComponent(id)}`)
}
