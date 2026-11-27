const rupiahFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

export function formatRupiah(value) {
  const amount = Number(value)
  return rupiahFormatter.format(Number.isFinite(amount) ? amount : 0)
}

export function formatReviewDate(value) {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) {
    return 'Tanggal tidak tersedia'
  }

  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(date)
}

export function describeError(error) {
  const message =
    typeof error === 'string'
      ? error
      : error?.message || 'Terjadi kesalahan.'
  const validationErrors = error?.errors ?? error?.data?.errors

  if (!validationErrors) {
    return message
  }

  const details = Array.isArray(validationErrors)
    ? validationErrors.flat(Infinity)
    : Object.entries(validationErrors).flatMap(([field, messages]) =>
        (Array.isArray(messages) ? messages : [messages]).map(
          (detail) => `${field}: ${detail}`,
        ),
      )

  return details.length ? `${message}\n${details.join('\n')}` : message
}
