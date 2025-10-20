import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './features/auth/AuthContext'
import ProtectedRoute from './features/auth/ProtectedRoute'
import Login from './pages/Login'
import Home from './pages/Home'
import RequestTrip from './pages/RequestTrip'
import Estimates from './pages/Estimates'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute><Home /></ProtectedRoute>
          }/>
          <Route path="/request" element={
            <ProtectedRoute><RequestTrip /></ProtectedRoute>
          }/>
          <Route path="/estimates" element={
            <ProtectedRoute><Estimates /></ProtectedRoute>
          }/>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
