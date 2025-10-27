// server/routes/match.js
import { Router } from 'express'
import Trip from '../models/Trip.js'
import Group from '../models/Group.js'
import User from '../models/User.js'
import { requireAuth } from '../middleware/requireAuth.js'

const r = Router()

const MIN_DIFF_MIN = 30         // ventana de tiempo ±30 min
const MAX_DEST_KM  = 3          // destinos a <= 3km

function minsDiff(a, b) {
  return Math.abs((a - b) / 60000)
}
function haversineKm(a, b) {
  const R = 6371
  const toRad = x => x * Math.PI / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const la1 = toRad(a.lat)
  const la2 = toRad(b.lat)
  const h = Math.sin(dLat/2)**2 + Math.cos(la1)*Math.cos(la2)*Math.sin(dLng/2)**2
  return 2*R*Math.asin(Math.sqrt(h))
}

/** Sugerencias para mi viaje */
r.get('/suggestions', requireAuth, async (req, res) => {
  try {
    const tripId = String(req.query.tripId || '')
    const myTrip = await Trip.findOne({ _id: tripId, userId: req.auth.id }).lean()
    if (!myTrip) return res.json([])

    const now = new Date()
    const candidates = await Trip.find({
      _id: { $ne: myTrip._id },
      status: 'planned',
      arrivalTime: { $gte: now },
      zone: myTrip.zone,
    })
    .populate('userId', 'name')
    .lean()

    const suggestions = candidates
      .filter(t => minsDiff(new Date(t.arrivalTime), new Date(myTrip.arrivalTime)) <= MIN_DIFF_MIN)
      .filter(t => haversineKm(
        {lat: t.destination.lat,    lng: t.destination.lng},
        {lat: myTrip.destination.lat, lng: myTrip.destination.lng}
      ) <= MAX_DEST_KM)
      .map(t => ({
        tripId: t._id,
        arrivalTime: t.arrivalTime,
        destination: t.destination,
        user: {
          id: t.userId?._id || t.userId,
          name: t.userId?.name || 'Usuario',
          initials: (t.userId?.name || 'U')
            .split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase()
        }
      }))

    res.json(suggestions)
  } catch (e) {
    res.status(500).json({ error: 'No se pudieron calcular sugerencias' })
  }
})

/** Unirme a un grupo (crea si no existe) */
r.post('/join', requireAuth, async (req, res) => {
  try {
    const { tripId, otherTripId } = req.body
    const myTrip    = await Trip.findOne({ _id: tripId, userId: req.auth.id })
    const otherTrip = await Trip.findById(otherTripId).populate('userId', 'name')
    if (!myTrip || !otherTrip) return res.status(400).json({ error: 'Viaje inválido' })

    // si el otro ya tiene grupo, únete si hay cupo
    let group = null
    if (otherTrip.groupId) {
      group = await Group.findById(otherTrip.groupId)
      if (!group) otherTrip.groupId = null
    }

    if (!group) {
      // crea grupo nuevo con ambos
      group = await Group.create({
        capacity: 3,
        destination: otherTrip.destination,
        members: [
          { userId: otherTrip.userId._id, tripId: otherTrip._id, name: otherTrip.userId.name },
          { userId: myTrip.userId,        tripId: myTrip._id,    name: (await User.findById(myTrip.userId)).name },
        ]
      })
      otherTrip.groupId = group._id
      myTrip.groupId    = group._id
      await otherTrip.save()
      await myTrip.save()
      return res.json({ ok: true, groupId: group._id })
    }

    // ya existe: revisa cupo
    if (group.members.length >= group.capacity) {
      return res.status(409).json({ error: 'Grupo lleno' })
    }

    // añade mi viaje si no está
    if (!group.members.some(m => m.tripId.toString() === myTrip._id.toString())) {
      const me = await User.findById(myTrip.userId).lean()
      group.members.push({ userId: myTrip.userId, tripId: myTrip._id, name: me?.name || 'Usuario' })
      await group.save()
    }
    myTrip.groupId = group._id
    await myTrip.save()

    res.json({ ok: true, groupId: group._id })
  } catch (e) {
    res.status(500).json({ error: 'No se pudo unir al grupo' })
  }
})

/** Ver miembros de un grupo */
r.get('/group/:id', requireAuth, async (req, res) => {
  try {
    const g = await Group.findById(req.params.id).lean()
    if (!g) return res.status(404).json({ error: 'Grupo no encontrado' })
    const members = g.members.map(m => ({
      id: m.userId,
      name: m.name,
      initials: (m.name || 'U').split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase()
    }))
    res.json({ id: g._id, capacity: g.capacity, members })
  } catch (e) {
    res.status(500).json({ error: 'No se pudo obtener el grupo' })
  }
})

export default r
