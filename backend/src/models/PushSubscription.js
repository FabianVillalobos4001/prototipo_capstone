import mongoose from 'mongoose'

const pushSubscriptionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    endpoint: { type: String, required: true, unique: true },
    keys: {
      p256dh: String,
      auth: String,
    },
    subscription: { type: Object, required: true },
  },
  { timestamps: true }
)

export default mongoose.models.PushSubscription || mongoose.model('PushSubscription', pushSubscriptionSchema)

