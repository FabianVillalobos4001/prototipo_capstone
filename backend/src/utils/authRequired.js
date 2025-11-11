// server/utils/authRequired.js
import jwt from 'jsonwebtoken'
export function authRequired(req,res,next){
  try{
    const token = req.cookies?.token
    if(!token) return res.status(401).json({error:'No autorizado'})
    const data = jwt.verify(token, process.env.JWT_SECRET || 'devsecret')
    req.user = { id: data.id, email: data.email, role: data.role }
    next()
  }catch{
    return res.status(401).json({error:'No autorizado'})
  }
}
