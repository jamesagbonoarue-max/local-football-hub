export const SESSION_KEY = 'local-football-session'
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '')

export async function apiRequest(path, { method = 'GET', body, token } = {}) {
  const sessionToken = token === undefined ? window.sessionStorage.getItem(SESSION_KEY) : token
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result.error || 'Unable to complete the request.')
  return result
}
