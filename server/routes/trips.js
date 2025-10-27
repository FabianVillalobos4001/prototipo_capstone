import { Router } from 'express'
import Trip from '../models/Trip.js'
import { requireAuth } from '../middleware/requireAuth.js'

const r = Router()

// Crear un viaje
r.post('/', requireAuth, async (req, res) => {
  try {
    const { origin, destination, arrivalTime, zone, bufferMinutes = 20 } = req.body
    if (!origin?.lat || !origin?.lng || !destination?.lat || !destination?.lng || !arrivalTime) {
      return res.status(400).json({ error: 'Datos incompletos' })
    }
    const trip = await Trip.create({
      userId: req.auth.id,
      origin,
      destination,
      arrivalTime: new Date(arrivalTime),
      zone,
      bufferMinutes,
      status: 'planned',
    })
    res.status(201).json(trip)
  } catch (e) {
    res.status(500).json({ error: 'Error al crear viaje' })
  }
})

/** 🔹 Mis viajes (lo que necesita Home.jsx) */
r.get('/mine', requireAuth, async (req, res) => {
  try {
    const trips = await Trip
      .find({ userId: req.auth.id })
      .sort({ arrivalTime: 1 })           // próximos primero
      .lean()
    res.json(trips)
  } catch (e) {
    res.status(500).json({ error: 'No se pudieron cargar tus viajes' })
  }
})

/** 🔸 (Opcional) Todos los planificados próximos con nombre de usuario
 *  útil si luego quieres mostrar “posibles matchings”
 */
r.get('/planned', requireAuth, async (req, res) => {
  try {
    const now = new Date()
    const trips = await Trip
      .find({ status: 'planned', arrivalTime: { $gte: now } })
      .populate('userId', 'name email')   // requiere Trip.userId { ref: 'User' }
      .sort({ arrivalTime: 1 })
      .lean()
    // normaliza el shape si quieres exponer nombre plano
    const data = trips.map(t => ({
      ...t,
      user: t.userId ? { id: t.userId._id, name: t.userId.name, email: t.userId.email } : null,
      userId: t.userId?._id ?? t.userId
    }))
    res.json(data)
  } catch (e) {
    res.status(500).json({ error: 'No se pudieron cargar los viajes' })
  }
})

export default r
