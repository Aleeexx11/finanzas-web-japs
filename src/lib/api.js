export const TOKEN_STORAGE_KEY = 'token'

const API_BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '')

export function getStoredToken() {
  if (typeof window === 'undefined') return null

  try {
    return window.sessionStorage.getItem(TOKEN_STORAGE_KEY)
  } catch {
    return null
  }
}

export function storeToken(token) {
  if (typeof window === 'undefined') return

  try {
    window.sessionStorage.setItem(TOKEN_STORAGE_KEY, token)
  } catch {
    throw new Error('No fue posible guardar la sesión en este navegador.')
  }
}

export function clearStoredToken() {
  if (typeof window === 'undefined') return

  try {
    window.sessionStorage.removeItem(TOKEN_STORAGE_KEY)
  } catch {
    // La sesión en memoria también se limpia aunque el navegador bloquee el almacenamiento.
  }
}

function buildUrl(path) {
  if (/^https?:\/\//i.test(path)) return path

  const normalizedPath = String(path).replace(/^\/+/, '')
  return API_BASE_URL ? `${API_BASE_URL}/${normalizedPath}` : `/${normalizedPath}`
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
  const requestHeaders = new Headers(headers)
  requestHeaders.set('Accept', 'application/json')

  const token = getStoredToken()
  if (token) requestHeaders.set('Authorization', `Bearer ${token}`)

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
    method,
    headers: requestHeaders,
    body: requestBody,
  })

  const data = await readResponse(response)

  if (!response.ok) {
    if (response.status === 401) {
      clearStoredToken()
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
