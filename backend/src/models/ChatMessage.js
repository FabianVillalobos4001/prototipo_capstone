import mongoose from 'mongoose'

const chatMessageSchema = new mongoose.Schema(
  {
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    senderName: { type: String, trim: true },
    body: { type: String, required: true, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
)

chatMessageSchema.index({ groupId: 1, createdAt: -1 })

export default mongoose.models.ChatMessage || mongoose.model('ChatMessage', chatMessageSchema)

