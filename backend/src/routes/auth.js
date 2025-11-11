// src/routes/auth.js
import { Router } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { requireAuth } from '../middleware/requireAuth.js'

const r = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'devsecret'
const COOKIE_NAME = 'token'

// Detecta entorno
const isProd = process.env.NODE_ENV === 'production'

// Usa los flags correctos segun entorno
function setAuthCookie(res, payload) {
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: isProd ? 'none' : 'lax',
    secure: isProd,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })
}

r.post('/login', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase()
  const password = String(req.body.password || '')
  const u = await User.findOne({ email })
  if (!u) return res.status(401).json({ error: 'Credenciales invalidas' })
  const ok = await bcrypt.compare(password, u.passwordHash)
  if (!ok) return res.status(401).json({ error: 'Credenciales invalidas' })

  setAuthCookie(res, { id: u._id, email: u.email, role: u.role })
  res.json({ user: safeUser(u) })
})

r.get('/me', async (req, res) => {
  try {
    const token = req.cookies?.[COOKIE_NAME]
    if (!token) return res.status(401).json({ error: 'No autorizado' })
    const data = jwt.verify(token, JWT_SECRET)
    const u = await User.findById(data.id).lean()
    if (!u) return res.status(401).json({ error: 'No autorizado' })
    res.json(safeUser(u))
  } catch {
    res.status(401).json({ error: 'Token invalido' })
  }
})

r.patch('/contact', requireAuth, async (req, res) => {
  try {
    const method = req.body?.contactMethod === 'chat' ? 'chat' : 'phone'
    const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : ''
    const chatHandle = typeof req.body?.chatHandle === 'string' ? req.body.chatHandle.trim() : ''
    const note = typeof req.body?.contactNote === 'string' ? req.body.contactNote.trim() : ''
    const share = Boolean(req.body?.shareContact)
    const hasValue = method === 'phone' ? !!phone : !!chatHandle

    const update = {
      phone: phone || null,
      carpoolContactMethod: method,
      carpoolChatHandle: chatHandle || null,
      carpoolContactNote: note || null,
      carpoolContactEnabled: share && hasValue,
    }

    const user = await User.findByIdAndUpdate(req.auth.id, update, { new: true }).lean()
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' })
    res.json(safeUser(user))
  } catch (err) {
    console.error('PATCH /auth/contact error', err)
    res.status(500).json({ error: 'No se pudo actualizar el contacto' })
  }
})

r.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, {
    path: '/',
    sameSite: isProd ? 'none' : 'lax',
    secure: isProd,
  })
  res.json({ ok: true })
})

export default r

function safeUser(u) {
  if (!u) return null
  return {
    id: u._id,
    email: u.email,
    name: u.name,
    zone: u.zone,
    role: u.role,
    phone: u.phone || '',
    carpoolContactMethod: u.carpoolContactMethod || 'phone',
    carpoolChatHandle: u.carpoolChatHandle || '',
    carpoolContactEnabled: Boolean(u.carpoolContactEnabled),
    carpoolContactNote: u.carpoolContactNote || '',
  }
}
