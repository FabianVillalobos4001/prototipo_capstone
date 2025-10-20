import { Router } from 'express'
const r = Router()

// Ruta temporal para verificar que funciona
r.get('/', (req, res) => {
  res.json({ message: '📦 Trips API activa' })
})

export default r
