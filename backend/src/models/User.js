// server/models/User.js
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true, index: true },
  name: { type: String, required: true },
  avatarUrl: String,
  zone: String,
  role: { type: String, default: "employee" },
  costCenter: String,
  phone: { type: String, trim: true },
  carpoolContactMethod: {
    type: String,
    enum: ["phone", "chat"],
    default: "phone",
  },
  carpoolChatHandle: { type: String, trim: true },
  carpoolContactEnabled: { type: Boolean, default: false },
  carpoolContactNote: { type: String, trim: true },
  passwordHash: { type: String, required: true }, // -> añade esto
}, { timestamps: true });

export default mongoose.model("User", UserSchema);

