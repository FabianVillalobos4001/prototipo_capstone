import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './features/auth/AuthContext'
import ProtectedRoute from './features/auth/ProtectedRoute'
import Header from './components/Header'
import BottomNav from './components/BottomNav'
import Home from './pages/Home'
import Login from './pages/Login'
import RequestTrip from './pages/RequestTrip'
import Deals from './pages/Deals'
import Profile from './pages/Profile'
import 'leaflet/dist/leaflet.css'
import ReceiptScanner from './pages/ReceiptScanner'
import GroupChat from './pages/GroupChat'

function AppShell() {
  const { pathname } = useLocation()
  const isAuth = pathname === '/login'
  const isChat = pathname.startsWith('/chat')

  return (
    <>
      {/* Opcional: ocultar Header en el chat para que sea full-bleed */}
      {!isAuth && !isChat && <Header />}

      <main
        className={
          isChat
            // 🔥 Chat: ocupar el viewport real sin padding ni scroll externo
            ? 'h-dvh overflow-hidden'
            // Resto de páginas: tal cual tenías
            : 'mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 py-6 md:py-8 overflow-y-auto min-h-[calc(100vh-3.5rem)] pb-24 md:min-h-0 md:h-auto'
        }
      >
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/request" element={<ProtectedRoute><RequestTrip /></ProtectedRoute>} />
          <Route path="/deals" element={<ProtectedRoute><Deals /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/receipts/scan" element={<ProtectedRoute><ReceiptScanner /></ProtectedRoute>} />
          <Route path="/receipt-scanner" element={<ProtectedRoute><ReceiptScanner /></ProtectedRoute>} />

          {/* 🔥 Chat dentro del main sin padding ni scroll externo */}
          <Route path="/chat/:groupId" element={<ProtectedRoute><GroupChat /></ProtectedRoute>} />

          <Route path="*" element={<Login />} />
        </Routes>
      </main>

      {/* Opcional: oculta la BottomNav en el chat para que no reste alto útil */}
      {!isAuth && !isChat && <BottomNav />}
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
