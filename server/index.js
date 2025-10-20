import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(express.json())

// Ruta de prueba
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hola desde Express 👋' })
})

// --- AUTH MOCK ---
// POST /api/auth/login  -> devuelve token y usuario “falso”
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body
  // validación mínima solo para no dejarlo vacío
  if (!email || !password) return res.status(400).json({ error: 'Email y password requeridos' })

  // token fijo de desarrollo
  const token = 'devtoken'
  // usuario “mock”
  const user = { id: 'u1', email, name: 'Usuario Demo' }

  return res.json({ token, user })
})

// GET /api/auth/me -> devuelve usuario si viene Authorization: Bearer devtoken
app.get('/api/auth/me', (req, res) => {
  const auth = req.headers.authorization || ''
  const isDevToken = auth === 'Bearer devtoken'
  if (!isDevToken) return res.status(401).json({ error: 'No autorizado' })

  // puedes devolver datos “mock” del usuario
  return res.json({ id: 'u1', email: 'demo@ejemplo.com', name: 'Usuario Demo' })
})






// Iniciar servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`)
})
