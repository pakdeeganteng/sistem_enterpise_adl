import { useEffect, useState } from 'react'

const PRODUCT_IMAGE_FALLBACKS = [
  {
    match: /headset|headphones/i,
    src: '/assets/products/headset-gaming-rgb.jpg',
  },
  {
    match: /monitor|led\s*24/i,
    src: '/assets/products/monitor-led-24-inch.jpg',
  },
  {
    match: /usb.?c|hub/i,
    src: '/assets/products/usb-c-hub-6-in-1.jpg',
  },
  {
    match: /ssd|storage/i,
    src: '/assets/products/ssd-eksternal-1tb.jpg',
  },
  {
    match: /stand/i,
    src: '/assets/products/stand-laptop-aluminium.jpg',
  },
]

function getImageSource(image) {
  if (typeof image !== 'string' || !image.trim()) {
    return null
  }

  const value = image.trim()
  if (/^(https?:\/\/|\/|data:image\/)/i.test(value)) {
    const dataImage = value.match(/^data:image\/png;base64,(.+)$/i)
    if (dataImage && isTinyPng(dataImage[1])) {
      return null
    }
    return value
  }

  if (value.startsWith('iVBORw0KGgo') && isTinyPng(value)) {
    return null
  }

  const mimeType = value.startsWith('iVBORw0KGgo')
    ? 'image/png'
    : value.startsWith('/9j/')
      ? 'image/jpeg'
      : value.startsWith('R0lGOD')
        ? 'image/gif'
        : value.startsWith('UklGR')
          ? 'image/webp'
          : 'image/png'

  return `data:${mimeType};base64,${value}`
}

function isTinyPng(base64) {
  try {
    const bytes = atob(base64)
    if (bytes.length < 24) {
      return true
    }

    const view = new DataView(
      Uint8Array.from(bytes, (character) => character.charCodeAt(0)).buffer,
    )
    return view.getUint32(16) < 16 || view.getUint32(20) < 16
  } catch {
    return false
  }
}

function getFallbackImage(name) {
  return (
    PRODUCT_IMAGE_FALLBACKS.find(({ match }) => match.test(name))?.src ??
    '/assets/products/electronics-default.svg'
  )
}

function ProductImage({
  image,
  name,
  className = '',
  loading = 'lazy',
  preferLocal = false,
}) {
  const fallbackSource = getFallbackImage(name)
  const primarySource = getImageSource(image)
  const hasLocalProductImage = PRODUCT_IMAGE_FALLBACKS.some(({ match }) =>
    match.test(name),
  )
  const useLocalImage = preferLocal && hasLocalProductImage
  const initialSource = useLocalImage ? fallbackSource : primarySource || fallbackSource
  const [source, setSource] = useState(initialSource)
  const [usingFallback, setUsingFallback] = useState(useLocalImage || !primarySource)
  const [fallbackUnavailable, setFallbackUnavailable] = useState(false)
  const imageClassName = `product-image ${className}`.trim()

  useEffect(() => {
    setSource(initialSource)
    setUsingFallback(useLocalImage || !primarySource)
    setFallbackUnavailable(false)
  }, [fallbackSource, initialSource, primarySource, useLocalImage])

  if (fallbackUnavailable) {
    return (
      <div
        className={`${imageClassName} product-image--unavailable`}
        role="img"
        aria-label={`Gambar ${name} tidak dapat dimuat`}
      >
        <span>Gambar produk tidak tersedia</span>
      </div>
    )
  }

  return (
    <div className={imageClassName}>
      <img
        src={source}
        alt={usingFallback ? `Foto referensi untuk ${name}` : name}
        loading={loading}
        onError={() => {
          if (!usingFallback) {
            setSource(fallbackSource)
            setUsingFallback(true)
          } else {
            setFallbackUnavailable(true)
          }
        }}
        onLoad={(event) => {
          if (
            !usingFallback &&
            (event.currentTarget.naturalWidth < 16 ||
              event.currentTarget.naturalHeight < 16)
          ) {
            setSource(fallbackSource)
            setUsingFallback(true)
          }
        }}
      />
    </div>
  )
}

export default ProductImage
