import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import PushSubscription from '../models/PushSubscription.js'

const r = Router()

r.post('/subscribe', requireAuth, async (req, res) => {
  try {
    const subscription = req.body
    if (!subscription?.endpoint) {
      return res.status(400).json({ error: 'Suscripcion invalida' })
    }

    await PushSubscription.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      {
        user: req.auth.id,
        endpoint: subscription.endpoint,
        keys: subscription.keys || {},
        subscription,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )

    res.json({ ok: true })
  } catch (err) {
    console.error('POST /notifications/subscribe error', err)
    res.status(500).json({ error: 'No se pudo guardar la suscripcion' })
  }
})

r.delete('/subscribe', requireAuth, async (req, res) => {
  try {
    const endpoint = req.body?.endpoint
    if (endpoint) {
      await PushSubscription.deleteOne({ user: req.auth.id, endpoint })
    } else {
      await PushSubscription.deleteMany({ user: req.auth.id })
    }
    res.json({ ok: true })
  } catch (err) {
    console.error('DELETE /notifications/subscribe error', err)
    res.status(500).json({ error: 'No se pudo borrar la suscripcion' })
  }
})

export default r

