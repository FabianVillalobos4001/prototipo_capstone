import { useState } from 'react'
import { useAuth } from '../features/auth/AuthContext'
import Input from '../components/Input'
import Button from '../components/Button'

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    try { await login(email, password) }
    catch (e) { setErr('Credenciales inválidas') }
  }

  return (
    <main className="min-h-screen grid place-items-center p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm grid gap-3">
        <h1 className="text-2xl font-bold">Iniciar sesión</h1>
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <Input label="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
        <Input label="Contraseña" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
        <Button type="submit">Entrar</Button>
      </form>
    </main>
  )
}
