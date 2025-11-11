// server/routes/match.js
import { Router } from 'express'
import Trip from '../models/Trip.js'
import Group from '../models/Group.js'
import User from '../models/User.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { buildRouteZone } from '../utils/zones.js'

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
    const myZones = buildRouteZone(myTrip.origin?.address, myTrip.destination?.address)
    const myZoneKey = myTrip.zone || myZones.zone || null

    const now = new Date()
    const candidates = await Trip.find({
      _id: { $ne: myTrip._id },
      status: 'planned',
      arrivalTime: { $gte: now },
    })
    .populate('userId', 'name')
    .lean()

    const suggestions = candidates
      .filter(t => !t.groupId)
      .filter(t => {
        const zones = buildRouteZone(t.origin?.address, t.destination?.address)
        const zoneKey = t.zone || zones.zone || null
        return !myZoneKey || !zoneKey || zoneKey === myZoneKey
      })
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
    if (myTrip.groupId) return res.status(409).json({ error: 'Ya perteneces a un grupo' })
    if (myTrip.status !== 'planned') return res.status(409).json({ error: 'Tu viaje ya fue emparejado' })

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
      otherTrip.status = 'matched'
      myTrip.groupId    = group._id
      myTrip.status     = 'matched'
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
    myTrip.status = 'matched'
    await myTrip.save()

    if (!otherTrip.status || otherTrip.status === 'planned') {
      otherTrip.status = 'matched'
      await otherTrip.save()
    }

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
    const tripIds = g.members.map((m) => m.tripId).filter(Boolean)
    const trips = tripIds.length
      ? await Trip.find({ _id: { $in: tripIds } }).lean()
      : []
    const tripMap = new Map(trips.map((t) => [String(t._id), t]))

    const members = g.members.map(m => {
      const trip = tripMap.get(String(m.tripId)) || null
      const origin = trip?.origin || null
      const destination = trip?.destination || null
      return ({
        id: m.userId,
        tripId: m.tripId,
        name: m.name,
        initials: (m.name || 'U').split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase(),
        origin,
        destination,
      })
    })

    const destinationPoint = g.destination || trips[0]?.destination || null

    const pickupStops = members
      .filter((m) => m.origin?.lat != null && m.origin?.lng != null)
      .sort((a, b) => {
        if (!destinationPoint) return 0
        const da = haversineKm(a.origin, destinationPoint)
        const db = haversineKm(b.origin, destinationPoint)
        return db - da // farthest first
      })
      .map((m) => ({
        type: 'pickup',
        label: m.name || 'Pasajero',
        lat: m.origin.lat,
        lng: m.origin.lng,
        address: m.origin.address,
        tripId: m.tripId,
      }))

    const routeStops = [...pickupStops]
    if (destinationPoint?.lat != null && destinationPoint?.lng != null) {
      routeStops.push({
        type: 'dropoff',
        label: destinationPoint.address || 'Destino',
        lat: destinationPoint.lat,
        lng: destinationPoint.lng,
        address: destinationPoint.address,
      })
    }

    res.json({
      id: g._id,
      capacity: g.capacity,
      members,
      destination: destinationPoint,
      route: { stops: routeStops },
    })
  } catch (e) {
    res.status(500).json({ error: 'No se pudo obtener el grupo' })
  }
})

export default r
