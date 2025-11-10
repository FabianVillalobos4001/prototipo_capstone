// server/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

import { connectDB } from './config/db.js';

import auth from './routes/auth.js';
import trips from './routes/trips.js';
import match from './routes/match.js';
import profile from './routes/profile.js';
import transvip from './routes/transvip/air.js';
import receiptsRouter from './routes/receipts.js';

// ⬇️ NUEVO: importa tu modelo de usuario (ajusta la ruta si difiere)
import User from './models/User.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

connectDB();

app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ------------------
//  Rutas API
// ------------------

// Rutas de recibos
app.use('/api/receipts', receiptsRouter);

// Rutas existentes
app.use('/api/auth', auth);
app.use('/api/trips', trips);
app.use('/api/match', match);
app.use('/api/profile', profile);
app.use('/api/transvip', transvip);

// ⬇️ NUEVO: endpoint para traer el usuario actual
// Para producción, cambias a JWT y lees req.user.email desde un middleware.
app.get('/api/me', async (req, res) => {
  try {
    const email = req.query.email; // temporal: /api/me?email=usuario@empresa.cl
    if (!email) {
      return res.status(400).json({ error: 'email requerido' });
    }

    // Busca el usuario real en Mongo Atlas
    const user = await User.findOne({ email }).lean();
    if (!user) {
      return res.status(404).json({ error: 'No encontrado' });
    }

    // Puedes filtrar campos sensibles si quieres
    // const { password, ...safe } = user;
    return res.json(user);
  } catch (e) {
    console.error('GET /api/me error:', e);
    return res.status(500).json({ error: 'Error de servidor' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

// 🔒 evita imprimir secretos en consola
// console.log('JWT_SECRET:', process.env.JWT_SECRET);

