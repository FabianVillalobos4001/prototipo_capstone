import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import path from 'path'
import { fileURLToPath } from 'url'

import { connectDB } from './config/db.js'

import auth from './routes/auth.js'
import trips from './routes/trips.js'
import match from './routes/match.js'
import profile from './routes/profile.js'
import transvip from './routes/transvip/air.js'
import receiptsRouter from './routes/receipts.js'

dotenv.config()
const app = express()
const PORT = process.env.PORT || 3000

connectDB()

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}))
app.use(cookieParser())
app.use(express.json())

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Rutas de recibos
app.use('/api/receipts', receiptsRouter)

// Rutas existentes
app.use('/api/auth', auth)
app.use('/api/trips', trips)
app.use('/api/match', match)
app.use('/api/profile', profile)
app.use('/api/transvip', transvip)

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
})

console.log('JWT_SECRET:', process.env.JWT_SECRET)

