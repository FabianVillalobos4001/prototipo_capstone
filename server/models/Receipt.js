// my-app/server/models/Receipt.js (ESM)
import mongoose from 'mongoose';

const ReceiptSchema = new mongoose.Schema(
  {
    // Campos estándar solicitados
    origen: { type: String, trim: true },
    destino: { type: String, trim: true },
    region: { type: String, trim: true },
    comuna: { type: String, trim: true },
    precio: { type: Number },
    metodoTransporte: {
      type: String,
      enum: ['uber', 'transvip', 'cabify', 'didi', 'otro'],
      lowercase: true,
      trim: true,
    },
    fechaHora: { type: Date },
    fecha: { type: Date },
    hora: { type: String },
    cantidadPasajeros: { type: Number },

    // Conservamos crudo y metadatos
    rawText: { type: String },
    imageUrl: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model('Receipt', ReceiptSchema);
