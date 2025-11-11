import { Router } from 'express'
import User from '../models/User.js'
import Trip from '../models/Trip.js'
// import Expense from '../models/Expense.js' // si lo usas

const r = Router()

// GET /api/profile/me  (requiere userId del token; en mock lo pasamos por query)
r.get('/me', async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId  // mock si aún no hay auth real
    if (!userId) return res.status(401).json({ error: 'No auth/userId' })

    const user = await User.findById(userId).lean()
    if (!user) return res.status(404).json({ error: 'Usuario no existe' })

    // últimos viajes (histórico)
    const trips = await Trip.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()

    // gastos simples desde trips finalizados (done)
    const expenseFromTrips = trips
      .filter(t => t.status === 'done' && t.price > 0)
      .map(t => ({
        type: t.provider?.name || 'Traslado',
        date: t.updatedAt || t.createdAt,
        amount: t.price,
        currency: 'CLP'
      }))

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl
      },
      trips: trips.map(t => ({
        from: t.origin?.label,
        to: t.destination?.label,
        date: new Date(t.arrivalTime || t.createdAt).toISOString().slice(0,10),
        price: t.price ? `$${t.price.toLocaleString('es-CL')}` : null,
        status: t.status,
        provider: t.provider?.name || null
      })),
      expenses: expenseFromTrips.map(e => ({
        type: e.type,
        date: new Date(e.date).toISOString().slice(0,10),
        price: `$${e.amount.toLocaleString('es-CL')}`
      }))
    })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error al obtener perfil' })
  }
})

export default r
