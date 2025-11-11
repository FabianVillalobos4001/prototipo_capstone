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

  const hash = await bcrypt.hash('123456', 12)

  const testUsers = Array.from({ length: 10 }).map((_, idx) => {
    const n = idx + 1
    return {
      email: `test.user${n}@gmail.com`,
      name: `Test User ${n}`,
      zone: 'demo',
      role: 'employee',
      costCenter: `TST${String(n).padStart(3, '0')}`,
      passwordHash: hash,
    }
  })

  await User.deleteMany({})
  await User.insertMany(testUsers)

  console.log('✅ Usuarios listos con pass 123')
  await mongoose.disconnect()
}
run().catch(console.error)
