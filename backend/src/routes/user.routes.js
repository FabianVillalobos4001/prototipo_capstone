const express = require("express");
const router = express.Router();
const User = require("../models/User");

// GET /api/me  (temporal: por query email mientras integras JWT)
router.get("/me", async (req, res) => {
  try {
    const email = req.query.email; // ej: ?email=usuario@empresa.cl
    if (!email) return res.status(400).json({ error: "email requerido" });

    const user = await User.findOne({ email }).lean();
    if (!user) return res.status(404).json({ error: "No encontrado" });

    res.json(user);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error de servidor" });
  }
});

module.exports = router;
