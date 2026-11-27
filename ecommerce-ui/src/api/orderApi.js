import { request } from './http.js'

const ORDER_URL = import.meta.env.VITE_ORDER_URL

export function getOrders() {
  return request(`${ORDER_URL}/orders`)
}

export function getOrder(id) {
  return request(`${ORDER_URL}/orders/${encodeURIComponent(id)}`)
}
