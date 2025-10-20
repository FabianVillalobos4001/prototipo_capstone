import mongoose from 'mongoose'
const Point = { lat: Number, lng: Number, label: String }

const TripSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  zone: { type: String, index: true },
  origin: Point,
  destination: Point,
  // fecha/hora del ARRIBO objetivo (la que pones en planner)
  arrivalTime: { type: Date, index: true },
  bufferMinutes: { type: Number, default: 20 },
  // planned | matched | requested | done | canceled
  status: { type: String, default: 'planned', index: true },
  // proveedor/estimación (cuando integres Uber/otros)
  provider: { name: String, estimate: String, requestId: String },
  // costo final (cuando el viaje se complete)
  price: { type: Number, default: 0 }, // CLP o la moneda que ocupen
  // referencia a un “group” si hubo carpool (opcional)
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
  // recibo/factura si existe
  receiptUrl: String
}, { timestamps: true })

export default mongoose.model('Trip', TripSchema)
