import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import dotenv from 'dotenv'
import User from '../models/User.js'

dotenv.config()

async function run() {
  await mongoose.connect(process.env.MONGO_URI, {
    dbName: process.env.DB_NAME || 'capstone_db'
  })
  console.log('✅ Conectado a', mongoose.connection.name)

  const hash = await bcrypt.hash('123', 12)

  await User.deleteMany({})
  await User.insertMany([
    { email: 'juan.perez@metso.com',  name: 'Juan Pérez',  zone: 'norte',  role: 'employee', costCenter: 'CC001', passwordHash: hash },
    { email: 'maria.gomez@metso.com', name: 'María Gómez', zone: 'centro', role: 'employee', costCenter: 'CC002', passwordHash: hash },
    { email: 'admin@metso.com',       name: 'Administrador', zone: 'sur',  role: 'admin',    costCenter: 'CC999', passwordHash: hash },
  ])

  console.log('✅ Usuarios listos con pass 123')
  await mongoose.disconnect()
}
run().catch(console.error)
