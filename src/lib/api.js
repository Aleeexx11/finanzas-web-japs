const API_BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '')
const API_ROOT_URL = API_BASE_URL.replace(/\/api$/i, '')
const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

if (typeof window !== 'undefined') {
  try {
    window.sessionStorage.removeItem('token')
  } catch {
    // Session cookies replace the legacy browser-stored Bearer token.
  }

  try {
    window.localStorage.removeItem('token')
  } catch {
    // The storage may be unavailable in privacy-restricted browser contexts.
  }
}

function buildUrl(path) {
  if (/^https?:\/\//i.test(path)) return path

  const normalizedPath = String(path).replace(/^\/+/, '')
  return API_BASE_URL ? `${API_BASE_URL}/${normalizedPath}` : `/${normalizedPath}`
}

function readXsrfCookie() {
  if (typeof document === 'undefined') return null

  const entry = document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith('XSRF-TOKEN='))

  if (!entry) return null

  try {
    return decodeURIComponent(entry.slice('XSRF-TOKEN='.length))
  } catch {
    return null
  }
}

async function ensureCsrfCookie(forceRefresh = false) {
  if (!forceRefresh && readXsrfCookie()) return

  const response = await fetch(`${API_ROOT_URL}/sanctum/csrf-cookie`, {
    method: 'GET',
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error('No fue posible iniciar la protección CSRF.')
  }
}

async function readResponse(response) {
  const responseText = await response.text()

  if (!responseText) return null

  try {
    return JSON.parse(responseText)
  } catch {
    return responseText
  }
}

async function request(path, { method = 'GET', body, headers, ...options } = {}) {
  const normalizedMethod = method.toUpperCase()
  const requestHeaders = new Headers(headers)
  requestHeaders.set('Accept', 'application/json')

  if (UNSAFE_METHODS.has(normalizedMethod)) {
    const normalizedPath = String(path).replace(/^\/+/, '')
    const startsNewSession = ['auth/login', 'auth/register'].includes(normalizedPath)
    await ensureCsrfCookie(startsNewSession)

    const xsrfToken = readXsrfCookie()
    if (xsrfToken) requestHeaders.set('X-XSRF-TOKEN', xsrfToken)
  }

  let requestBody
  if (body !== undefined) {
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData

    if (isFormData) {
      requestBody = body
    } else {
      requestHeaders.set('Content-Type', 'application/json')
      requestBody = JSON.stringify(body)
    }
  }

  const response = await fetch(buildUrl(path), {
    ...options,
    credentials: 'include',
    method: normalizedMethod,
    headers: requestHeaders,
    body: requestBody,
  })

  const data = await readResponse(response)

  if (!response.ok) {
    if (response.status === 401) {
      window.dispatchEvent(new Event('auth:unauthorized'))
    }

    const message =
      (typeof data === 'object' && data !== null && typeof data.message === 'string'
        ? data.message
        : null) ||
      (typeof data === 'string' ? data : null) ||
      response.statusText ||
      `Error HTTP ${response.status}`

    const error = new Error(message)
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}

export function get(path, options = {}) {
  return request(path, { ...options, method: 'GET' })
}

export function post(path, body, options = {}) {
  return request(path, { ...options, method: 'POST', body })
}

export function put(path, body, options = {}) {
  return request(path, { ...options, method: 'PUT', body })
}

export function deleteRequest(path, options = {}) {
  return request(path, { ...options, method: 'DELETE' })
}

export const api = {
  get,
  post,
  put,
  delete: deleteRequest,
}
