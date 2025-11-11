import { createContext, useContext, useEffect, useState } from 'react'
import api from '../../api/axios'
import { initPushNotifications } from '../../utils/push'

const AuthCtx = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = async (options = {}) => {
    const { data } = await api.get('/auth/me', options)
    setUser(data)
    return data
  }

  // Se llama al montar
  useEffect(() => {
    const controller = new AbortController()
    console.log('[Auth] init -> GET /auth/me')
    refreshUser({ signal: controller.signal })
      .catch(err => {
        console.log('[Auth] /auth/me FAIL', err?.response?.status)
      })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (!user) return
    initPushNotifications()
  }, [user])

  const login = async (email, password) => {
    console.log('[Auth] POST /auth/login', email)
    const { data } = await api.post('/auth/login', { email, password })
    await refreshUser()
    return data.user
  }

  const logout = async () => {
    await api.post('/auth/logout')
    setUser(null)
  }

  return (
    <AuthCtx.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthCtx.Provider>
  )
}

export const useAuth = () => useContext(AuthCtx)
