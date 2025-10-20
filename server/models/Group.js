// server/models/Group.js
import mongoose from 'mongoose'
const Member = new mongoose.Schema({
  tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  origin: { lat: Number, lng: Number, label: String },
  pickupEta: String
}, { _id: false })

const GroupSchema = new mongoose.Schema({
  zone: { type: String, index: true },
  date: { type: String, index: true }, // YYYY-MM-DD
  destination: { lat: Number, lng: Number, label: String },
  members: [Member],
  routeOrder: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Trip' }],
  provider: { name: String, estimate: String, eta: Number, requestId: String },
  dropoffEta: String,
  targetArrival: Date,
  bufferMinutes: Number
}, { timestamps: true })
export default mongoose.model('Group', GroupSchema)