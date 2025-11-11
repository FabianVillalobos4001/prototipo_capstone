import mongoose from 'mongoose'

const pointSchema = new mongoose.Schema({
  address: { type: String, trim: true },
  lat: Number,
  lng: Number,
}, { _id: false })

const optionSchema = new mongoose.Schema({
  id: String,
  name: String,
  provider: String,
  price: Number,
  priceText: String,
  currency: String,
  etaMin: Number,
  link: String,
}, { _id: false })

const quickSelectionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userEmail: { type: String, trim: true },
  origin: pointSchema,
  destination: pointSchema,
  options: { type: [optionSchema], default: [] },
  selectedOption: optionSchema,
  selectedOptionId: String,
  selectedPrice: Number,
  selectedCurrency: String,
  cheapestAlternativePrice: Number,
  cheapestAlternativeOptionId: String,
  savedAmountVsCheapest: Number,
}, {
  timestamps: true,
})

quickSelectionSchema.index({ createdAt: -1 })
quickSelectionSchema.index({ user: 1, createdAt: -1 })

export default mongoose.models.QuickSelection || mongoose.model('QuickSelection', quickSelectionSchema)
