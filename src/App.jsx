import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./features/auth/AuthContext";
// import ProtectedRoute from "./features/auth/ProtectedRoute";

import Header from "./components/Header";
import BottomNav from "./components/BottomNav";

import Home from "./pages/Home";
import Login from "./pages/Login";
import RequestTrip from "./pages/RequestTrip";
import Estimates from "./pages/Estimates";
import Profile from "./pages/Profile";

function AppShell() {
  return (
    <>
      {/* Header SIEMPRE visible */}
      <Header />

      {/* Contenido con scroll propio y espacio para la bottom bar en móvil */}
      <main className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 py-6 md:py-8 overflow-y-auto min-h-[calc(100vh-3.5rem)] pb-24 md:min-h-0 md:h-auto">
        <Routes>
          {/* PÚBLICAS */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Profile />} />
          <Route path="/request" element={<RequestTrip />} />
          <Route path="/estimates" element={<Estimates />} />

          {/* Privadas (cuando las necesites) */}
          {/*
          <Route
            path="/privado"
            element={
              <ProtectedRoute>
                <ComponentePrivado />
              </ProtectedRoute>
            }
          />
          */}
        </Routes>
      </main>

      {/* Barra inferior solo en móviles */}
      <BottomNav />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </AuthProvider>
  );
}
