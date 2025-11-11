import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import Input from '../components/Input'
import Button from '../components/Button'

export default function Login() {
  const { login } = useAuth()
  const nav = useNavigate()
  const loc = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setErr('')
    setLoading(true)
    try {
      await login(email, password)
      nav(loc.state?.from || '/', { replace: true })
    } catch (e) {
      setErr(e?.response?.data?.error || 'Credenciales inválidas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen grid place-items-center p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm grid gap-3">
        <h1 className="text-2xl font-bold">Iniciar sesión</h1>
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <Input label="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
        <Input label="Contraseña" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
        <Button type="submit" disabled={loading}>{loading ? 'Entrando…' : 'Entrar'}</Button>
      </form>
    </main>
  )
}
