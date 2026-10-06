import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { AuthContext } from '@/context/auth-context'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function restoreSession() {
      try {
        const response = await api.get('/auth/user')
        if (active) setUser(response.user)
      } catch {
        if (active) setUser(null)
      } finally {
        if (active) setLoading(false)
      }
    }

    restoreSession()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    function handleUnauthorized() {
      setUser(null)
      setLoading(false)
    }

    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized)
  }, [])

  function saveSession(response) {
    setUser(response.user)
    setLoading(false)
    return response.user
  }

  async function login(credentials) {
    const response = await api.post('/auth/login', credentials)
    return saveSession(response)
  }

  async function register(details) {
    const response = await api.post('/auth/register', details)
    return saveSession(response)
  }

  async function logout() {
    await api.post('/auth/logout')
    setUser(null)
  }

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
