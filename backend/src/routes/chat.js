import { Router } from 'express'
import ChatMessage from '../models/ChatMessage.js'
import Group from '../models/Group.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { notifyChatMessage } from '../services/push.js'

const r = Router()

async function getGroupForUser(groupId, userId) {
  if (!groupId) return null
  const group = await Group.findById(groupId).lean()
  if (!group) return null
  const isMember = group.members?.some((m) => String(m.userId) === String(userId))
  return isMember ? group : null
}

r.get('/:groupId/messages', requireAuth, async (req, res) => {
  try {
    const { groupId } = req.params
    const group = await getGroupForUser(groupId, req.auth.id)
    if (!group) return res.status(403).json({ error: 'No perteneces a este grupo' })

    const limit = Math.min(parseInt(req.query.limit || '100', 10), 200)
    const after = req.query.after ? new Date(req.query.after) : null
    const filter = { groupId }
    if (after && !isNaN(after.getTime())) {
      filter.createdAt = { $gt: after }
    }

    const messages = await ChatMessage.find(filter)
      .sort({ createdAt: 1 })
      .limit(limit)
      .lean()

    const payload = messages.map((m) => ({
      id: m._id,
      sender: m.sender,
      senderName: m.senderName,
      body: m.body,
      createdAt: m.createdAt,
    }))

    res.json({ messages: payload })
  } catch (err) {
    console.error('GET /chat/:groupId/messages error', err)
    res.status(500).json({ error: 'No se pudieron cargar los mensajes' })
  }
})

r.post('/:groupId/messages', requireAuth, async (req, res) => {
  try {
    const { groupId } = req.params
    const bodyText = String(req.body?.body || '').trim()
    if (!bodyText) return res.status(400).json({ error: 'Mensaje vacio' })

    const group = await getGroupForUser(groupId, req.auth.id)
    if (!group) return res.status(403).json({ error: 'No perteneces a este grupo' })

    const member = group.members?.find((m) => String(m.userId) === String(req.auth.id))
    const senderName = member?.name || 'Companero'

    const message = await ChatMessage.create({
      groupId,
      sender: req.auth.id,
      senderName,
      body: bodyText,
    })

    notifyChatMessage({ group, senderId: req.auth.id, senderName, body: bodyText }).catch(() => {})

    res.status(201).json({
      message: {
        id: message._id,
        sender: message.sender,
        senderName: message.senderName,
        body: message.body,
        createdAt: message.createdAt,
      },
    })
  } catch (err) {
    console.error('POST /chat/:groupId/messages error', err)
    res.status(500).json({ error: 'No se pudo enviar el mensaje' })
  }
})

export default r

