import { Router } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const r = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'devsecret'
const COOKIE_NAME = 'token'

function setAuthCookie(res, payload) {
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',   // para localhost va bien
    path: '/',         // <- importante
    secure: false,     // en local http, en prod pon true + https + app.set('trust proxy',1)
    maxAge: 7*24*60*60*1000,
  })
}

r.post('/login', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase()
  const password = String(req.body.password || '')
  const u = await User.findOne({ email })
  if (!u) return res.status(401).json({ error: 'Credenciales inválidas' })
  const ok = await bcrypt.compare(password, u.passwordHash)
  if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' })
  setAuthCookie(res, { id: u._id, email: u.email, role: u.role })
  res.json({ user: { id: u._id, email: u.email, name: u.name, zone: u.zone, role: u.role } })
})

r.get('/me', async (req, res) => {
  try {
    const token = req.cookies?.[COOKIE_NAME]
    if (!token) return res.status(401).json({ error: 'No autorizado' })
    const data = jwt.verify(token, JWT_SECRET)
    const u = await User.findById(data.id).lean()
    if (!u) return res.status(401).json({ error: 'No autorizado' })
    res.json({ id: u._id, email: u.email, name: u.name, zone: u.zone, role: u.role })
  } catch {
    res.status(401).json({ error: 'Token inválido' })
  }
})

r.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, { path: '/' })
  res.json({ ok: true })
})

export default r
