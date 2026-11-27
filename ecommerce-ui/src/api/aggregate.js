import { getCart } from './cartApi.js'
import { getOrder as fetchOrder, getOrders as fetchOrders } from './orderApi.js'
import { getProduct, getProducts } from './productApi.js'
import { getProductReviews } from './reviewApi.js'
import { getProductCategory } from '../utils/catalog.js'

export async function getProductsWithRating() {
  const response = await getProducts()
  const products = response.data

  return Promise.all(
    products.map(async (product) => {
      try {
        const reviewResponse = await getProductReviews(product.id)
        const summary = reviewResponse.data.summary

        return {
          ...product,
          average_rating: summary.average_rating,
          total_reviews: summary.total_reviews,
        }
      } catch {
        return {
          ...product,
          average_rating: null,
          total_reviews: null,
          rating_unavailable: true,
        }
      }
    }),
  )
}

export async function getOrders() {
  const response = await fetchOrders()
  return response.data
}

export async function getOrder(orderId) {
  const response = await fetchOrder(orderId)
  return response.data
}

export async function getProductDetail(productId) {
  const [productResult, reviewResult, productsResult] = await Promise.allSettled([
    getProduct(productId),
    getProductReviews(productId),
    getProducts(),
  ])

  if (productResult.status === 'rejected') {
    throw productResult.reason
  }

  const product = productResult.value.data
  const products =
    productsResult.status === 'fulfilled' ? productsResult.value.data : []
  const sameCategory = products.filter(
    (candidate) =>
      String(candidate.id) !== String(product.id) &&
      getProductCategory(candidate) === getProductCategory(product),
  )
  const relatedProducts = (sameCategory.length ? sameCategory : products.filter(
    (candidate) => String(candidate.id) !== String(product.id),
  )).slice(0, 4)

  return {
    product,
    reviews:
      reviewResult.status === 'fulfilled' ? reviewResult.value.data : null,
    relatedProducts,
    relatedProductsUnavailable: productsResult.status === 'rejected',
  }
}

export async function getCartDetail(userId) {
  const cartResponse = await getCart(userId)
  const cart = cartResponse.data

  const items = await Promise.all(
    cart.items.map(async (item) => {
      try {
        const productResponse = await getProduct(item.product_id)
        return {
          ...item,
          product: productResponse.data,
        }
      } catch {
        return {
          ...item,
          product: null,
        }
      }
    }),
  )

  const totalPrice = items.reduce((total, item) => {
    if (!item.product) {
      return total
    }

    return total + Number(item.product.price) * item.quantity
  }, 0)

  return { items, totalPrice }
}
