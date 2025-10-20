import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import { connectDB } from './config/db.js'

import auth from './routes/auth.js'
import profile from './routes/profile.js'

dotenv.config()
connectDB()

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors({
  origin: 'http://localhost:5173', // <- Vite
  credentials: true,               // <- imprescindible para cookies
}))
app.use(cookieParser())
app.use(express.json())

app.use('/api/auth', auth)
app.use('/api/profile', profile)

app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`)
})
