export function notifyCartUpdated() {
  window.dispatchEvent(new Event('adulshop:cart-updated'))
}
