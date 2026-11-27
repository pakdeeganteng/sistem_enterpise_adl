const REQUEST_TIMEOUT_MS = 5000

export class ApiError extends Error {
  constructor(message, { status = null, errors = null, data = null } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
    this.data = data
  }
}

async function parseResponse(response) {
  const text = await response.text()

  if (!text) {
    return null
  }

  try {
    return JSON.parse(text)
  } catch {
    if (!response.ok) {
      return { message: response.statusText || 'HTTP error' }
    }

    throw new ApiError('Respons server bukan JSON yang valid.', {
      status: response.status,
    })
  }
}

export async function request(url, options = {}) {
  const controller = new AbortController()
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')

  let body = options.body
  if (
    body !== undefined &&
    body !== null &&
    typeof body !== 'string' &&
    !(typeof FormData !== 'undefined' && body instanceof FormData)
  ) {
    headers.set('Content-Type', 'application/json')
    body = JSON.stringify(body)
  }

  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      body,
      signal: controller.signal,
    })
    const data = await parseResponse(response)

    if (!response.ok) {
      const validationErrors = data?.errors ?? null
      const message =
        data?.message ??
        (response.status === 422
          ? 'Data yang dikirim tidak valid'
          : `Request gagal (${response.status})`)

      throw new ApiError(message, {
        status: response.status,
        errors: validationErrors,
        data,
      })
    }

    return data
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }

    if (controller.signal.aborted || error?.name === 'AbortError') {
      throw new ApiError('Server terlalu lama menjawab.')
    }

    if (error instanceof TypeError) {
      throw new ApiError('Tidak dapat terhubung ke server.')
    }

    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}
