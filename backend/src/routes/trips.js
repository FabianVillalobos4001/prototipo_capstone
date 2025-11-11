import { Router } from 'express'
import Trip from '../models/Trip.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { buildRouteZone } from '../utils/zones.js'

const r = Router()

// Crear un viaje (planned)
r.post('/', requireAuth, async (req, res) => {
  try {
    const { origin, destination, arrivalTime, bufferMinutes = 20 } = req.body
    if (!origin?.lat || !origin?.lng || !destination?.lat || !destination?.lng || !arrivalTime) {
      return res.status(400).json({ error: 'Datos incompletos' })
    }

    const zones = buildRouteZone(origin?.address, destination?.address)

    const trip = await Trip.create({
      userId: req.auth.id,
      origin,
      destination,
      arrivalTime: new Date(arrivalTime),
      originZone: zones.originZone,
      destinationZone: zones.destinationZone,
      zone: zones.zone,
      bufferMinutes,
      status: 'planned',
    })
    res.status(201).json(trip)
  } catch (e) {
    console.error('POST /api/trips error:', e)
    res.status(500).json({ error: 'Error al crear viaje' })
  }
})

/** 🔹 Mis viajes (próximos/planificados) — lo que usa Home.jsx */
r.get('/mine', requireAuth, async (req, res) => {
  try {
    const trips = await Trip
      .find({ userId: req.auth.id })
      .sort({ arrivalTime: 1 }) // próximos primero
      .lean()

    const normalized = trips.map((trip) => {
      if (trip.zone && trip.originZone && trip.destinationZone) return trip
      const zones = buildRouteZone(trip.origin?.address, trip.destination?.address)
      return {
        ...trip,
        originZone: trip.originZone || zones.originZone,
        destinationZone: trip.destinationZone || zones.destinationZone,
        zone: trip.zone || zones.zone,
        originZoneLabel: zones.originZoneLabel,
        destinationZoneLabel: zones.destinationZoneLabel,
        zoneLabel: zones.zoneLabel || trip.zone,
      }
    })

    res.json(normalized)
  } catch (e) {
    console.error('GET /api/trips/mine error:', e)
    res.status(500).json({ error: 'No se pudieron cargar tus viajes' })
  }
})

/** 🔸 Todos los planificados próximos (con datos de usuario) — útil para matching */
r.get('/planned', requireAuth, async (req, res) => {
  try {
    const now = new Date()
    const trips = await Trip
      .find({ status: 'planned', arrivalTime: { $gte: now } })
      .populate('userId', 'name email')
      .sort({ arrivalTime: 1 })
      .lean()

    const data = trips.map(t => {
      const zones = buildRouteZone(t.origin?.address, t.destination?.address)
      return {
        ...t,
        originZone: t.originZone || zones.originZone,
        destinationZone: t.destinationZone || zones.destinationZone,
        zone: t.zone || zones.zone,
        originZoneLabel: zones.originZoneLabel,
        destinationZoneLabel: zones.destinationZoneLabel,
        zoneLabel: zones.zoneLabel || t.zone,
        user: t.userId ? { id: t.userId._id, name: t.userId.name, email: t.userId.email } : null,
        userId: t.userId?._id ?? t.userId,
      }
    })
    res.json(data)
  } catch (e) {
    console.error('GET /api/trips/planned error:', e)
    res.status(500).json({ error: 'No se pudieron cargar los viajes' })
  }
})

/** ✅ Marcar viaje como completado (histórico)
 * PATCH /api/trips/:id/complete   body: { fare?, completedAt? }
 */
r.patch('/:id/complete', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const { fare, completedAt } = req.body

    const update = {
      status: 'completed',
      ...(fare != null ? { fare } : {}),
      completedAt: completedAt ? new Date(completedAt) : new Date(),
    }

    const trip = await Trip.findOneAndUpdate(
      { _id: id, userId: req.auth.id },
      update,
      { new: true }
    )

    if (!trip) return res.status(404).json({ error: 'No encontrado' })
    res.json(trip)
  } catch (e) {
    console.error('PATCH /api/trips/:id/complete error:', e)
    res.status(500).json({ error: 'Error al completar viaje' })
  }
})

/** ✅ Viajes del usuario (paginado)
 * GET /api/trips/me?status=completed|planned&limit=10&page=1&sort=...
 * - status por defecto: completed
 * - sort por defecto: arrivalTime (planned) o -createdAt (completed)
 * Respuesta: { items, total, page, totalPages, limit }
 */
r.get('/me', requireAuth, async (req, res) => {
  try {
    const status = req.query.status || 'completed'
    const limit = Math.min(parseInt(req.query.limit || '10', 10), 100)
    const page = Math.max(parseInt(req.query.page || '1', 10), 1)
    const sort = req.query.sort || (status === 'planned' ? 'arrivalTime' : '-createdAt')

    const query = { userId: req.auth.id, status }

    const [items, total] = await Promise.all([
      Trip.find(query).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
      Trip.countDocuments(query),
    ])

    const mapped = items.map(t => ({
      _id: t._id,
      from: t.origin?.address || '-',
      to: t.destination?.address || '-',
      date: (t.completedAt || t.arrivalTime || t.createdAt)?.toISOString().slice(0, 10),
      price: t.fare != null ? `$${t.fare.toLocaleString('es-CL')}` : null,
      status: t.status,
    }))

    return res.json({
      items: mapped,
      total,
      page,
      totalPages: Math.max(Math.ceil(total / limit), 1),
      limit,
    })
  } catch (e) {
    console.error('GET /api/trips/me error:', e)
    res.status(500).json({ error: 'No se pudieron cargar tus viajes' })
  }
})

export default r
