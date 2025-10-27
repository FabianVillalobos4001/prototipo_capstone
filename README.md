# PROTOTIPO CAPSTONE — Frontend + Backend

Repositorio monorepo con frontend en React (Vite + Tailwind CSS) y backend en Node.js (Express + MongoDB/Mongoose). Incluye un flujo de “Escanear boleta” con OCR en el navegador (Tesseract.js) y estandarización/almacenamiento en la base de datos.

---

## Estructura Del Repositorio

```
my-app/
  package.json                # Frontend (Vite)
  vite.config.js              # Config Vite + Tailwind
  index.html
  src/
    api/
      axios.js               # Instancia Axios base http://localhost:3000/api
      receipts.js            # API cliente de recibos
      trips.js               # API cliente de viajes
    components/              # UI (Header, BottomNav, etc.)
    features/auth/           # Contexto auth + rutas protegidas
    hooks/                   # Hooks reutilizables
    lib/                     # Integraciones (Google Maps, geocoding)
    pages/                   # Páginas (Home, Login, Profile, RequestTrip, Deals)
      ReceiptScanner.jsx     # Escaneo/Upload + OCR en cliente
    main.jsx
    App.jsx                  # Rutas, layout y navegación

  server/
    package.json             # Backend (ESM habilitado)
    index.js                 # App Express + rutas + estáticos
    nodemon.json
    .env                     # Variables de entorno (local)
    config/
      db.js                  # Conexión a MongoDB
    middleware/
      requireAuth.js         # (si corresponde)
    models/
      User.js                # Usuario
      Trip.js                # Viajes
      Expense.js             # (existente)
      Group.js, GroupRide.js # (existentes)
      Receipt.js             # NUEVO modelo Recibo/Boleta
    routes/
      auth.js                # Login/Logout/Me (JWT via cookie)
      trips.js               # Viajes
      match.js               # Matching
      profile.js             # Perfil
      transvip/air.js        # Integración externa (existente)
      receipts.js            # NUEVOS endpoints Recibos/Boletas
    scripts/
      seedUsers.js           # Seeder usuarios
    utils/
      parseReceipt.js        # Parser de texto OCR → campos normalizados
    uploads/                 # Carpeta de imágenes servida como estático
```

---

## Tecnologías

- Frontend
  - Vite 7, React 19, React Router 7
  - Tailwind CSS 4 (plugin @tailwindcss/vite)
  - Axios
  - Tesseract.js (OCR en navegador)

- Backend
  - Node.js 20/22 con módulos ESM
  - Express 4, CORS, cookie-parser, dotenv, multer (uploads)
  - Mongoose 8 (MongoDB)

---

## Configuración Y Entorno

- Requisitos
  - Node.js >= 20
  - MongoDB (local o Atlas)

- Variables de entorno
  - Frontend: usa base URL fija en `src/api/axios.js`
    - `baseURL`: `http://localhost:3000/api`
    - `withCredentials`: `true` (JWT via cookie)
  - Backend (`my-app/server/.env`)
    - `PORT=3000`
    - `MONGO_URI=mongodb+srv://...` (o local)
    - `JWT_SECRET=un_secreto_para_firmar_jwt`

---

## Scripts

- Frontend (desde `my-app/`)
  - `npm run dev` → levanta Vite en `http://localhost:5173`
  - `npm run build`, `npm run preview`

- Backend (desde `my-app/server/`)
  - `npm run dev` → nodemon en `http://localhost:3000`
  - `npm start` → node index.js
  - `npm run seed:users` → ejecuta seeder básico

Sugerencia (opcional): ejecutar ambos a la vez con `concurrently` desde el root del frontend.

---

## Backend

- Módulos ESM habilitados (`type: module` en `server/package.json`). Usa `import … from` en todo el backend.
- Conexión DB: `server/config/db.js` conecta vía `mongoose.connect(process.env.MONGO_URI)`.
- Middlewares
  - `cors({ origin: 'http://localhost:5173', credentials: true })`
  - `cookieParser()` y `express.json()`
  - Archivos estáticos: `app.use('/uploads', express.static(path.join(__dirname, 'uploads')))`

**Rutas principales**
- Auth: `/api/auth` → `login`, `me`, `logout` (JWT en cookie httpOnly)
- Trips: `/api/trips`
- Match: `/api/match`
- Profile: `/api/profile`
- Transvip: `/api/transvip`
- Recibos/Boletas: `/api/receipts` (NUEVO)

**Recibos/Boletas (OCR + guardado)**
- Modelo `Receipt` (`server/models/Receipt.js`)
  - `direccion: String`
  - `origen: String`
  - `destino: String`
  - `precio: Number`
  - `fechaHora: Date`
  - `cantidadPasajeros: Number`
  - `rawText: String` (texto OCR crudo; opcional)
  - `imageUrl: String` (ruta pública)
  - `createdBy: ObjectId` (User)

- Parser `parseReceipt(text)` (`server/utils/parseReceipt.js`)
  - Heurísticas con regex para extraer: fecha y hora, precio (total), dirección, origen, destino, cantidad de pasajeros.
  - Mejorable por formato específico de boletas locales (CL/ES).

- Endpoints (`server/routes/receipts.js`)
  - `POST /api/receipts/upload` → multipart/form-data `image` → `{ imageUrl }`
  - `POST /api/receipts/parse` → `{ text }` → campos normalizados
  - `POST /api/receipts` → `{ text?, parsed?, imageUrl? }` → crea y guarda el documento
  - `GET /api/receipts` → lista últimos 50
  - `GET /api/receipts/:id` → detalle

Uploads
- Guardados en `server/uploads/receipts` y servidos por `/uploads/receipts/...`.
- En producción, considerar S3/Cloud Storage.

---

## Frontend

- Entradas relevantes
  - `src/App.jsx`: rutas y layout (Header, BottomNav). Rutas protegidas con `ProtectedRoute`.
  - `src/features/auth/AuthContext.jsx`: contexto, login con cookie JWT vía `/api/auth`.
  - `src/components/Header.jsx`: incluye botón “Escanear boleta”
  - `src/components/BottomNav.jsx`: pestaña “Escanear” con icono de cámara
  - `src/pages/ReceiptScanner.jsx` (NUEVO)
    - Modos: “Subir archivo” (archivo/galería) y “Usar cámara” (getUserMedia)
    - OCR con `tesseract.js` (`spa+eng`)
    - Vista previa, parseo, guardado (imagen + texto) vía API recibos
    - Lista últimas boletas

- Cliente Axios (`src/api/axios.js`)
  - `baseURL: http://localhost:3000/api`
  - `withCredentials: true` (para cookies)

- API Recibos (`src/api/receipts.js`)
  - `uploadReceiptImage(file)`
  - `parseReceiptText(text)`
  - `createReceipt({ text, parsed, imageUrl })`
  - `listReceipts()`

Rutas App.jsx
- `/, /request, /deals, /profile, /login`
- `/receipts/scan` (nuevo) y alias existente `/receipt-scanner`

---

## Puesta En Marcha

1) Backend
- Variables en `server/.env` (ver sección Configuración y Entorno)
- Instalar dependencias: `cd my-app/server && npm i`
- Arrancar: `npm run dev` → `http://localhost:3000`

2) Frontend
- Instalar dependencias: `cd my-app && npm i`
- Instalar OCR: `npm i tesseract.js`
- Arrancar: `npm run dev` → `http://localhost:5173`

3) Flujo Recibos (local)
- Ir a `http://localhost:5173/receipts/scan`
- Subir imagen (PC/galería) o usar cámara
- Opcional: “Extraer texto (OCR)”
- “Guardar” → sube imagen, parsea (si hay texto) y persiste en MongoDB

---

## Notas Y Limitaciones

- OCR
  - Tesseract.js descarga modelos de idioma en tiempo de ejecución (requiere internet en desarrollo).
  - Idiomas configurados: `spa+eng`. Se puede reducir a `spa` para boletas en español.
- Archivos soportados
  - Imágenes comunes (jpg/png). PDF/HEIC no están contemplados por ahora (se puede extender).
- Seguridad
  - JWT en cookie httpOnly; en producción usar `secure: true`, `sameSite` apropiado y `app.set('trust proxy', 1)` si hay proxy.
- Estáticos
  - Imágenes servidas por `/uploads`. En producción, preferir almacenamiento externo.

---

## Dependencias (Resumen)

- Frontend
  - `react`, `react-dom`, `react-router-dom`
  - `vite`, `@vitejs/plugin-react`
  - `tailwindcss`, `@tailwindcss/vite`
  - `axios`, `tesseract.js`

- Backend
  - `express`, `cors`, `cookie-parser`, `dotenv`
  - `mongoose`, `multer`
  - `axios`, `jsonwebtoken`, `bcrypt` (auth), `tough-cookie` (si aplica)
  - Dev: `nodemon`

---

## Próximos Pasos (Sugerencias)

- Mejorar parser para formatos de boleta locales (regex por etiquetas típicas).
- Soporte PDF/HEIC con conversión previa (cliente o servidor).
- Validación y corrección manual de campos antes de guardar.
- Subida a almacenamiento externo (S3) y CDN.

