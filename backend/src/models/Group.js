// server/models/Group.js
import mongoose from 'mongoose'
const MemberSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tripId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  name: String,
}, { _id: false })

const GroupSchema = new mongoose.Schema({
  capacity:   { type: Number, default: 3 },
  destination: { lat: Number, lng: Number, address: String },
  members:    [MemberSchema],
}, { timestamps: true })

export default mongoose.model('Group', GroupSchema)
