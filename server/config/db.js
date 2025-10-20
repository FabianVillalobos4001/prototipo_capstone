import mongoose from 'mongoose'
import dotenv from 'dotenv'
dotenv.config()

export async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: process.env.DB_NAME || 'capstone_db',
    })
    console.log('✅ Conectado a MongoDB Atlas')
  } catch (err) {
    console.error('❌ Error al conectar a MongoDB:', err.message)
    process.exit(1)
  }
}
