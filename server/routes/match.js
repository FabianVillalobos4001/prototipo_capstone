// server/routes/match.js
import { Router } from 'express'
import { runMatching } from '../services/matching.js'
import { authRequired } from '../utils/authRequired.js'

const r = Router()

r.post('/run', authRequired, async (req,res)=>{
  const { windowMinutes=30, maxGroupSize=4 } = req.body || {}
  const result = await runMatching({ windowMinutes, maxGroupSize })
  res.json(result)
})

export default r
