import { useEffect, useState } from 'react'
import { AuthContext } from './authContext.js'
import { apiRequest, clearSessionToken, getSessionToken, saveSessionToken } from './authApi.js'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(() => Boolean(getSessionToken()))

  useEffect(() => {
    let active = true
    const token = getSessionToken()
    if (!token) return undefined

    apiRequest('/api/auth/me', { token })
      .then((result) => { if (active) setUser(result.user) })
      .catch(clearSessionToken)
      .finally(() => { if (active) setLoading(false) })

    return () => { active = false }
  }, [])

  async function login(credentials) {
    const result = await apiRequest('/api/auth/login', { method: 'POST', body: credentials, token: '' })
    saveSessionToken(result.token, Boolean(credentials.rememberMe))
    setUser(result.user)
    return result.user
  }

  async function register(account) {
    return apiRequest('/api/auth/register', { method: 'POST', body: account, token: '' })
  }

  function logout() {
    clearSessionToken()
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>
}
