import { createContext, useContext, useEffect, useState } from 'react'
import api from '../../api/axios'

const AuthCtx = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Se llama al montar
  useEffect(() => {
    console.log('[Auth] init -> GET /auth/me')
    api.get('/auth/me')
      .then(res => {
        console.log('[Auth] /auth/me OK', res.data)
        setUser(res.data)
      })
      .catch(err => {
        console.log('[Auth] /auth/me FAIL', err?.response?.status)
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = async (email, password) => {
    console.log('[Auth] POST /auth/login', email)
    const { data } = await api.post('/auth/login', { email, password })
    // confirma con /auth/me para poblar user desde cookie
    const me = await api.get('/auth/me')
    setUser(me.data)
    return data.user
  }

  const logout = async () => {
    await api.post('/auth/logout')
    setUser(null)
  }

  return (
    <AuthCtx.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthCtx.Provider>
  )
}

export const useAuth = () => useContext(AuthCtx)
