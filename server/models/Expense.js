import mongoose from 'mongoose'
const ExpenseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' }, // opcional
  type: { type: String, default: 'Transporte' }, // Uber/Traslado interno/etc.
  amount: { type: Number, required: true },
  currency: { type: String, default: 'CLP' },
  date: { type: Date, default: Date.now }
}, { timestamps: true })
export default mongoose.model('Expense', ExpenseSchema)
