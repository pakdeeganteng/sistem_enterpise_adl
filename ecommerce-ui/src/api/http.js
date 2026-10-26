const TIMEOUT_MS = 5000;

export class ApiError extends Error {
  constructor(message, { status = 0, errors = null } = {}) {
    super(message);

    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

export async function request(baseUrl, path, { method = 'GET', body } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}${path}`, {
        method,
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
    });

    const responseText = await response.text();
    let payload = null;

    if (responseText) {
        try {
            payload = JSON.parse(responseText);
        } catch {
            if (response.ok) {
              throw new ApiError('respons server tidak valid', {
                status: response.status,
              });
            }
        }
    }

    if (!response.ok) {
        throw new ApiError(payload?.message ?? 'permintaan gagal', {
            status: response.status,
            errors: payload?.errors ?? null,
        });
    }

    return payload;
  } catch (error) {
    if (error instanceof ApiError) {
        throw error;
    }

    if (error?.name === 'AbortError') {
        throw new ApiError('server terlalu lama menjawab');
    }

    throw new ApiError('tidak dapat terhubung ke server');
  } finally {
    clearTimeout(timer);
  }
}
