import jwt from 'jsonwebtoken'

const COOKIE_NAME = 'token'
const JWT_SECRET = process.env.JWT_SECRET || 'devsecret'

export function requireAuth(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME]
  if (!token) return res.status(401).json({ error: 'No autorizado' })
  try {
    const data = jwt.verify(token, JWT_SECRET)
    req.auth = { id: data.id, email: data.email, role: data.role }
    next()
  } catch {
    return res.status(401).json({ error: 'Token inválido' })
  }
}
