import { Router } from 'express'
import Trip from '../models/Trip.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { buildRouteZone } from '../utils/zones.js'

const r = Router()

// Crear un viaje
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
    const data = trips.map(t => {
      const zones = buildRouteZone(t.origin?.address, t.destination?.address)
      return ({
        ...t,
        originZone: t.originZone || zones.originZone,
        destinationZone: t.destinationZone || zones.destinationZone,
        zone: t.zone || zones.zone,
        originZoneLabel: zones.originZoneLabel,
        destinationZoneLabel: zones.destinationZoneLabel,
        zoneLabel: zones.zoneLabel || t.zone,
        user: t.userId ? { id: t.userId._id, name: t.userId.name, email: t.userId.email } : null,
        userId: t.userId?._id ?? t.userId
      })
    })
    res.json(data)
  } catch (e) {
    res.status(500).json({ error: 'No se pudieron cargar los viajes' })
  }
})

export default r
