import { useEffect, useState } from 'react'
import { AuthContext } from './authContext.js'
import { apiRequest, SESSION_KEY } from './authApi.js'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(() => Boolean(window.sessionStorage.getItem(SESSION_KEY)))

  useEffect(() => {
    let active = true
    const token = window.sessionStorage.getItem(SESSION_KEY)
    if (!token) return undefined

    apiRequest('/api/auth/me', { token })
      .then((result) => { if (active) setUser(result.user) })
      .catch(() => window.sessionStorage.removeItem(SESSION_KEY))
      .finally(() => { if (active) setLoading(false) })

    return () => { active = false }
  }, [])

  async function login(credentials) {
    const result = await apiRequest('/api/auth/login', { method: 'POST', body: credentials, token: '' })
    window.sessionStorage.setItem(SESSION_KEY, result.token)
    setUser(result.user)
    return result.user
  }

  async function register(account) {
    return apiRequest('/api/auth/register', { method: 'POST', body: account, token: '' })
  }

  function logout() {
    window.sessionStorage.removeItem(SESSION_KEY)
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>
}
