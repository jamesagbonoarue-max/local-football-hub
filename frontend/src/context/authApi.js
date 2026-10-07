export const SESSION_KEY = 'local-football-session'
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://local-football-hub.onrender.com').replace(/\/+$/, '')

export function getSessionToken() {
  return window.localStorage.getItem(SESSION_KEY) || window.sessionStorage.getItem(SESSION_KEY)
}

export function getSessionUser(token) {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const binary = window.atob(base64)
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
    const claims = JSON.parse(new TextDecoder().decode(bytes))
    if (
      !claims ||
      typeof claims.id !== 'string' ||
      typeof claims.name !== 'string' ||
      typeof claims.email !== 'string' ||
      !['admin', 'user'].includes(claims.role) ||
      !Number.isFinite(claims.exp) ||
      claims.exp * 1000 <= Date.now()
    ) return null

    return { id: claims.id, name: claims.name, email: claims.email, role: claims.role }
  } catch {
    return null
  }
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
  if (!response.ok) {
    const error = new Error(result.error || 'Unable to complete the request.')
    error.status = response.status
    throw error
  }
  return result
}
