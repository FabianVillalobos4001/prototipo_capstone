# 🚀 PROTOTIPO CAPSTONE — Frontend + Backend

Este proyecto es una base completa para trabajar en equipo entre **frontend (React + Vite + Tailwind CSS)** y **backend (Express + Node.js)**.

Está pensado para:
- 👩‍💻 Estudiantes que cursan su **primer ramo de diseño de software**, y quieren entender cómo se estructura un proyecto moderno.
- 🧑‍🔧 Compañeros con **experiencia en backend** que implementarán la lógica de negocio y las APIs.

---

## 🧩 Estructura general del proyecto

```
PROTOTIPO-CAPSTONE/
│
├─ my-app/                 # Frontend (React + Vite + TailwindCSS)
│  ├─ src/
│  ├─ index.html
│  ├─ package.json
│  └─ vite.config.js
│
└─ my-app/server/          # Backend (Express)
   ├─ index.js
   ├─ .env
   ├─ nodemon.json
   └─ package.json
```

---

## 🧱 Tecnologías y versiones utilizadas

| Área | Herramienta | Versión estable |
|------|--------------|----------------|
| Frontend | **Vite** | 5.x |
| | **React** | 18.x o 19.x |
| | **TailwindCSS** | 4.x |
| | **@tailwindcss/vite** | 4.x |
| Backend | **Express** | 4.19.2 |
| | **CORS** | 2.8.5 |
| | **Dotenv** | 16.4.5 |
| | **Nodemon** | 3.1.10 |
| General | **Node.js** | 18.x o 20.x (también funciona con 22.x) |

---

## ⚙️ Instalación paso a paso

### 🟦 1. Crear el frontend con Vite + React

Desde la carpeta raíz del proyecto:
```bash
npm create vite@latest my-app -- --template react
cd my-app
npm install
```

### 🟩 2. Configurar TailwindCSS v4

```bash
npm i -D tailwindcss @tailwindcss/vite
```

#### 🧩 vite.config.js
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwind from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwind()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000' // conexión con backend
    }
  }
})
```

#### 🧩 src/index.css
```css
@import "tailwindcss";

@theme {
  /* Ejemplo de personalización */
  /* --color-brand: #0ea5e9; */
}
```

#### 🧩 src/App.jsx
```jsx
import { useEffect, useState } from 'react'
import './index.css'

export default function App() {
  const [msg, setMsg] = useState('...')

  useEffect(() => {
    fetch('/api/hello')
      .then(r => r.json())
      .then(d => setMsg(d.message))
      .catch(e => setMsg('error: ' + e.message))
  }, [])

  return (
    <div className="min-h-screen grid place-items-center">
      <h1 className="text-2xl font-bold">{msg}</h1>
    </div>
  )
}
```

#### Correr el frontend
```bash
npm run dev
# → http://localhost:5173
```

---

### 🟥 3. Crear el backend con Express

Desde dentro de `my-app`:

```bash
mkdir server
cd server
npm init -y
npm i express@4.19.2 cors@2.8.5 dotenv@16.4.5
npm i -D nodemon@3.1.10
```

#### 🧩 server/package.json
```json
{
  "name": "server",
  "version": "1.0.0",
  "type": "module",
  "main": "index.js",
  "scripts": {
    "dev": "nodemon --config nodemon.json",
    "start": "node index.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2"
  },
  "devDependencies": {
    "nodemon": "^3.1.10"
  }
}
```

#### 🧩 server/nodemon.json
```json
{
  "watch": ["index.js", "routes", "controllers"],
  "ext": "js,mjs,cjs,json",
  "ignore": [
    "node_modules",
    ".git",
    ".env",
    ".env.*",
    "npm-debug.log",
    "yarn.lock",
    "package-lock.json"
  ],
  "exec": "node index.js"
}
```

#### 🧩 server/.env
```
PORT=3000
API_KEY=tu_super_secreto
```

#### 🧩 server/index.js
```js
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

// Ruta de prueba
app.get('/api/hello', (_req, res) => {
  res.json({ message: 'Hola desde Express 👋' })
})

// Ejemplo de API que usa variable privada
app.get('/api/datos', async (_req, res) => {
  try {
    const r = await fetch('https://api.ejemplo.com/data', {
      headers: { Authorization: `Bearer ${process.env.API_KEY}` }
    })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    res.json(await r.json())
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener datos' })
  }
})

app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`)
})
```

#### Correr el backend
```bash
cd my-app/server
npm run dev
# ✅ Servidor corriendo en http://localhost:3000
```

---

## 🤝 4. Trabajo en equipo

| Rol | Responsabilidades | Carpeta |
|-----|--------------------|----------|
| 👩‍🎨 Frontend (Diseño de Software) | Maquetar interfaz, conectar al backend vía `fetch('/api/...')`, manejar estados y componentes. | `my-app/` |
| 🧑‍💻 Backend (Informática) | Definir endpoints REST, lógica de negocio, conexión a APIs externas o base de datos. | `my-app/server/` |

**Ambos pueden trabajar en paralelo**:  
El frontend usa el *proxy* de Vite (`/api`) que redirige las peticiones al backend automáticamente.

---

## 🧪 5. Verificar conexión

1. Backend encendido → [http://localhost:3000/api/hello](http://localhost:3000/api/hello)  
   → `{ "message": "Hola desde Express 👋" }`

2. Frontend encendido → [http://localhost:5173](http://localhost:5173)  
   → Muestra el mismo mensaje en pantalla.

---

## ⚙️ 6. Ejecutar todo junto (opcional)

Desde `my-app`:

```bash
npm i -D concurrently
```

Agrega en `my-app/package.json`:
```json
"scripts": {
  "dev": "vite",
  "dev:all": "concurrently \"npm run dev\" \"npm --prefix server run dev\""
}
```

Luego:
```bash
npm run dev:all
```

Esto levantará **frontend y backend al mismo tiempo**.

---

## 🛡️ Buenas prácticas

- ❌ Nunca subir `.env` al repositorio.
- ✅ Usar `.gitignore` para ignorar `node_modules` y archivos temporales.
- 🌐 En producción, restringir CORS solo al dominio de la aplicación.
- 💬 Usar `console.log` para depuración local, y un *logger* (como `pino`) si se despliega online.

---

## ✅ Estado final esperado

| Servicio | Puerto | Comando | URL |
|-----------|---------|----------|------|
| Frontend | 5173 | `npm run dev` | [http://localhost:5173](http://localhost:5173) |
| Backend | 3000 | `npm run dev` | [http://localhost:3000/api/hello](http://localhost:3000/api/hello) |

---

### 📚 En resumen
- **Diseño de Software:** trabaja visual y funcionalmente el frontend.
- **Informática / Backend:** implementa rutas y lógica de negocio.
- Ambos se comunican por HTTP usando `/api/...`.

---

> 💡 Consejo: este proyecto puede crecer añadiendo **base de datos**, **autenticación**, o **API externas**.  
> La base que construyeron ahora les servirá para todo lo que venga después.
