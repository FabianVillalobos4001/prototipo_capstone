// server/models/Trip.js
import mongoose from 'mongoose'
const TripSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  origin: {
    address: String,
    lat: Number,
    lng: Number,
  },
  destination: {
    address: String,
    lat: Number,
    lng: Number,
  },
  arrivalTime: Date,            // hora objetivo de llegada
  bufferMinutes: { type: Number, default: 20 },
  zone: { type: String, index: true }, // norte/centro/sur (rápido para filtros)
  status: { type: String, default: 'planned', enum: ['planned','matched','completed','cancelled'] },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'GroupRide' },
}, { timestamps: true })

export default mongoose.model('Trip', TripSchema)
