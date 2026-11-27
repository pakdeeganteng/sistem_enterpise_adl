const PRODUCT_CATEGORIES = [
  { match: /headset|headphone|earphone|audio/i, label: 'Audio' },
  { match: /monitor|display|led/i, label: 'Monitor' },
  { match: /usb.?c|hub|adapter/i, label: 'Hub & konektivitas' },
  { match: /ssd|storage|penyimpanan/i, label: 'Penyimpanan' },
  { match: /stand|laptop|keyboard|mouse/i, label: 'Aksesori komputer' },
]

export function getProductCategory(product) {
  const name = typeof product === 'string' ? product : product?.name ?? ''
  return (
    PRODUCT_CATEGORIES.find(({ match }) => match.test(name))?.label ??
    'Lainnya'
  )
}

export function getProductCategories(products) {
  return [...new Set(products.map(getProductCategory))].sort((first, second) =>
    first.localeCompare(second, 'id-ID'),
  )
}
