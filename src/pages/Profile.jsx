import { useEffect, useState } from "react";
import { useAuth } from "../features/auth/AuthContext";

function Avatar({ name = "Usuario", src }) {
  if (src)
    return (
      <img src={src} alt={name} className="h-16 w-16 rounded-full object-cover" />
    );

  const initials = name
    .split(" ")
    .map((n) => n[0]?.toUpperCase())
    .slice(0, 2)
    .join("");

  return (
    <div className="h-16 w-16 rounded-full bg-neutral-800 text-white grid place-items-center text-lg font-semibold">
      {initials || "U"}
    </div>
  );
}

export default function Profile() {
  const { user, logout } = useAuth();
  const [trips, setTrips] = useState([]);
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    // Mock temporal, puedes reemplazarlo con api.get('/profile/me')
    setTrips([
      { from: "Planta Quilicura", to: "Metro Los Libertadores", date: "2025-10-18", price: "$3.800" },
      { from: "Oficina Apoquindo", to: "Planta Quilicura", date: "2025-10-15", price: "$5.100" },
      { from: "Planta Quilicura", to: "Metro Vespucio Norte", date: "2025-10-10", price: "$3.200" },
    ]);
    setExpenses([
      { type: "Traslado interno", date: "2025-10-18", price: "$3.800" },
      { type: "Uber (estimación)", date: "2025-10-15", price: "$5.100" },
      { type: "Traslado interno", date: "2025-10-10", price: "$3.200" },
    ]);
  }, []);

  if (!user) return null;

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-3xl flex flex-col items-center gap-8">
        {/* Cabecera usuario */}
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-center sm:text-left">
          <Avatar name={user.name} src={user.avatarUrl} />
          <div>
            <h2 className="text-xl font-semibold">{user.name}</h2>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>

        {/* Contenedores de información */}
        <div className="grid gap-8 w-full sm:grid-cols-2">
          {/* Viajes históricos */}
          <section className="border rounded-xl p-4 shadow-sm">
            <h3 className="text-lg font-semibold mb-3">Viajes históricos</h3>
            <div className="space-y-3">
              {trips.map((t, i) => (
                <div
                  key={i}
                  className="flex justify-between items-start border-b border-gray-200 pb-2 last:border-none"
                >
                  <div>
                    <p className="font-medium">
                      {t.from} → {t.to}
                    </p>
                    <p className="text-sm text-gray-500">
                      {t.date} · Completado
                    </p>
                  </div>
                  <p className="text-sm font-medium">{t.price}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Gastos */}
          <section className="border rounded-xl p-4 shadow-sm">
            <h3 className="text-lg font-semibold mb-3">Gastos</h3>
            <div className="space-y-3">
              {expenses.map((e, i) => (
                <div
                  key={i}
                  className="flex justify-between items-start border-b border-gray-200 pb-2 last:border-none"
                >
                  <div>
                    <p className="font-medium">{e.type}</p>
                    <p className="text-sm text-gray-500">{e.date}</p>
                  </div>
                  <p className="text-sm font-medium">{e.price}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* 🔒 Botón para cerrar sesión */}
        <button
          onClick={logout}
          className="mt-6 px-6 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition"
        >
          Cerrar sesión
        </button>
      </div>
    </main>
  );
}
