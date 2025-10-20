// server/models/User.js
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true, index: true },
  name: { type: String, required: true },
  avatarUrl: String,
  zone: String,
  role: { type: String, default: "employee" },
  costCenter: String,
  passwordHash: { type: String, required: true }, // 👈 añade esto
}, { timestamps: true });

export default mongoose.model("User", UserSchema);
