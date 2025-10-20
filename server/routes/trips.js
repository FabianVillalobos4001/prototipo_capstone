import { Router } from 'express'
import Trip from '../models/Trip.js'
import { authRequired } from '../utils/authRequired.js'

const r = Router()

r.post('/', authRequired, async (req,res)=>{
  const { origin, destination, arrivalTime, zone, bufferMinutes=20 } = req.body
  if (!origin?.lat || !origin?.lng || !destination?.lat || !destination?.lng)
    return res.status(400).json({ error: 'Faltan coordenadas de origen/destino' })
  if (!arrivalTime) return res.status(400).json({ error: 'Falta fecha/hora de llegada' })

  const trip = await Trip.create({
    userId: req.user.id,
    origin, destination, arrivalTime, zone, bufferMinutes
  })
  res.status(201).json(trip)
})

r.get('/mine', authRequired, async (req,res)=>{
  const trips = await Trip.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean()
  res.json(trips)
})

export default r
