// server/routes/trips.js
import { Router } from 'express'
import Trip from '../models/Trip.js'
import { authRequired } from '../utils/authRequired.js' // middleware que lee cookie y mete req.user

const r = Router()

// crear viaje (planificación)
r.post('/', authRequired, async (req,res)=>{
  const { origin, destination, arrivalTime, zone, bufferMinutes=20 } = req.body
  const t = await Trip.create({
    userId: req.user.id, origin, destination, arrivalTime, zone, bufferMinutes
  })
  res.status(201).json(t)
})

// listar del usuario (para HomePage)
r.get('/mine', authRequired, async (req,res)=>{
  const trips = await Trip.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean()
  res.json(trips)
})

export default r
