// server/models/GroupRide.js
import mongoose from 'mongoose'
const GroupRideSchema = new mongoose.Schema({
  destination: { address: String, lat: Number, lng: Number },
  arrivalTime: Date,
  members: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    origin: { address: String, lat: Number, lng: Number }
  }],
  orderedPickup: [{ userId: mongoose.Schema.Types.ObjectId }], // orden sugerido
  status: { type: String, default: 'draft', enum: ['draft','requested','active','done'] },
  provider: { type: String, default: 'simulated' }, // luego “uber”, “cabify”, etc.
}, { timestamps: true })

export default mongoose.model('GroupRide', GroupRideSchema)
