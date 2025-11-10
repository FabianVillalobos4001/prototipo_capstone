import mongoose from 'mongoose'

const TripSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },

  origin: { address: String, lat: Number, lng: Number, placeId: String },
  destination: { address: String, lat: Number, lng: Number, placeId: String },

  arrivalTime: Date,              // hora objetivo de llegada (plan)
  completedAt: Date,              // ⬅️ nuevo: cuándo terminó realmente
  fare: { type: Number },         // ⬅️ nuevo: monto (opcional)

  originZone: { type: String },
  destinationZone: { type: String },
  zone: String,

  bufferMinutes: { type: Number, default: 20 },
  status: { type: String, default: 'planned', index: true }, // planned | ongoing | completed | cancelled
}, { timestamps: true })

export default mongoose.model('Trip', TripSchema)
