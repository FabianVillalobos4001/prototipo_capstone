// server/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

import { connectDB } from './src/config/db.js';

import auth from './src/routes/auth.js';
import trips from './src/routes/trips.js';
import match from './src/routes/match.js';
import profile from './src/routes/profile.js';
import transvip from './src/routes/transvip/air.js';
import quick from './src/routes/quick.js';
import chat from './src/routes/chat.js';
import notifications from './src/routes/notifications.js';
import receiptsRouter from './src/routes/receipts.js';

// Modelo de usuario (ajusta si tu ruta difiere)
import User from './src/models/User.js';

dotenv.config();

const app = express();
app.set('trust proxy', 1); // si usas proxy/reverse proxy (Vercel, etc.)
const PORT = process.env.PORT || 3000;

// Conexión a DB
connectDB();

// Orígenes permitidos (separados por coma en FRONTEND_URLS)
const allowed = (process.env.FRONTEND_URLS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

// CORS base: valida origen contra la lista y permite credenciales
app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true); // permite curl/healthchecks sin Origin
    if (allowed.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json());

// Static /uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ Middleware adicional: refleja Origin y habilita credenciales (Safari/iPhone)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowed.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

// ✅ Preflight global robusto (OPTIONS) con headers/métodos comunes
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  if (origin && allowed.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  return res.sendStatus(200);
});

// ------------------
//  Rutas API
// ------------------

// Recibos
app.use('/api/receipts', receiptsRouter);

// Rutas existentes
app.use('/api/auth', auth);
app.use('/api/trips', trips);
app.use('/api/match', match);
app.use('/api/profile', profile);
app.use('/api/transvip', transvip);
app.use('/api/quick', quick);
app.use('/api/chat', chat);
app.use('/api/notifications', notifications);

// Endpoint temporal: obtener usuario por email (solo demo)
app.get('/api/me', async (req, res) => {
  try {
    const email = req.query.email; // /api/me?email=usuario@empresa.cl
    if (!email) return res.status(400).json({ error: 'email requerido' });

    const user = await User.findOne({ email }).lean();
    if (!user) return res.status(404).json({ error: 'No encontrado' });

    return res.json(user);
  } catch (e) {
    console.error('GET /api/me error:', e);
    return res.status(500).json({ error: 'Error de servidor' });
  }
});

// Arranque
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

// 🔒 evita imprimir secretos en consola
// console.log('JWT_SECRET:', process.env.JWT_SECRET);
