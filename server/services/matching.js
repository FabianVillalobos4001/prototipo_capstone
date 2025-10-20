// server/services/matching.js
import Trip from '../models/Trip.js'
import GroupRide from '../models/GroupRide.js'

export async function runMatching({ windowMinutes = 30, maxGroupSize = 4 }) {
  const now = new Date()
  const horizon = new Date(now.getTime() + 24*60*60*1000) // próxima 24h (ajusta)

  // busca candidatos
  const trips = await Trip.find({
    status: 'planned',
    arrivalTime: { $gte: now, $lte: horizon }
  }).lean()

  // agrupa por (zona + destino aproximado + franja horaria)
  const buckets = new Map()

  for (const t of trips) {
    const slot = slotKey(t.arrivalTime, windowMinutes)
    const destKey = `${round(t.destination.lat,3)},${round(t.destination.lng,3)}`
    const key = `${t.zone}|${destKey}|${slot}`
    if (!buckets.has(key)) buckets.set(key, [])
    buckets.get(key).push(t)
  }

  const results = []
  for (const [key, arr] of buckets) {
    // ordena por distancia al destino (más lejos primero)
    arr.sort((a,b)=>{
      const da = dist(a.origin, a.destination)
      const db = dist(b.origin, b.destination)
      return db - da
    })

    // parte por grupos de tamaño <= maxGroupSize
    for (let i=0; i<arr.length; i+=maxGroupSize) {
      const chunk = arr.slice(i, i+maxGroupSize)
      if (chunk.length < 2) continue // al menos 2 para compartir

      const group = await GroupRide.create({
        destination: chunk[0].destination,
        arrivalTime: chunk[0].arrivalTime,
        members: chunk.map(t=>({ userId: t.userId, origin: t.origin })),
        orderedPickup: chunk.map(t=>({ userId: t.userId })), // ya están ordenados
        status: 'draft',
        provider: 'simulated'
      })

      // marca trips como matched
      const ids = chunk.map(t=>t._id)
      await Trip.updateMany({ _id: { $in: ids } }, { $set: { status: 'matched', groupId: group._id } })

      results.push(group._id)
    }
  }
  return { groups: results }
}

function dist(p1, p2){
  const dx = (p1.lat - p2.lat)
  const dy = (p1.lng - p2.lng)
  return Math.sqrt(dx*dx + dy*dy)
}
function round(n, d){ const m = Math.pow(10,d); return Math.round(n*m)/m }
function slotKey(date, windowMinutes){
  const ts = new Date(date).getTime()
  const slot = Math.floor(ts / (windowMinutes*60*1000))
  return `${slot}`
}
