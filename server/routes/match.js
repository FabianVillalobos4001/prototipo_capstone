import { Router } from 'express'
const r = Router()

r.get('/', (req, res) => {
  res.json({ message: '🤝 Match API activa' })
})

export default r
