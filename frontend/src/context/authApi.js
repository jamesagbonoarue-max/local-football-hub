export const SESSION_KEY = 'local-football-session'
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://local-football-hub.onrender.com').replace(/\/+$/, '')

export function getSessionToken() {
  return window.localStorage.getItem(SESSION_KEY) || window.sessionStorage.getItem(SESSION_KEY)
}

export function saveSessionToken(token, rememberMe) {
  window.localStorage.removeItem(SESSION_KEY)
  window.sessionStorage.removeItem(SESSION_KEY)
  const storage = rememberMe ? window.localStorage : window.sessionStorage
  storage.setItem(SESSION_KEY, token)
}

export function clearSessionToken() {
  window.localStorage.removeItem(SESSION_KEY)
  window.sessionStorage.removeItem(SESSION_KEY)
}

export async function apiRequest(path, { method = 'GET', body, token } = {}) {
  const sessionToken = token === undefined ? getSessionToken() : token
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      ...(body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
    },
    ...(body ? { body: (body instanceof FormData ? body : JSON.stringify(body)) } : {}),
  })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result.error || 'Unable to complete the request.')
  return result
}
