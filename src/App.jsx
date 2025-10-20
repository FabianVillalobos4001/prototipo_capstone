import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './features/auth/AuthContext'
import ProtectedRoute from './features/auth/ProtectedRoute'
import Header from './components/Header'

import Login from './pages/Login'
import Home from './pages/Home'
import RequestTrip from './pages/RequestTrip'
import Estimates from './pages/Estimates'

function AppShell() {
  const { pathname } = useLocation()
  const hideHeader = pathname === '/login'   // si NO quieres header en login

  return (
    <>
      {!hideHeader && <Header />}
      <main className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 py-6">
        <Routes>
          {/* Inicio PÚBLICO */}
          <Route path="/" element={<Home />} />

          {/* Auth */}
          <Route path="/login" element={<Login />} />

          {/* Rutas PRIVADAS */}
          <Route path="/request" element={<ProtectedRoute><RequestTrip /></ProtectedRoute>} />
          <Route path="/estimates" element={<ProtectedRoute><Estimates /></ProtectedRoute>} />
        </Routes>
      </main>
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </AuthProvider>
  )
}

