import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";

const navItems = [
  { to: "/", label: "Inicio" },
  { to: "/request", label: "Solicitar viaje" },
  { to: "/estimates", label: "Estimaciones" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth?.() ?? { user: null, logout: () => {} };
  const closeMenu = () => setOpen(false);

  return (
    <header className="sticky top-0 z-40 bg-black border-b border-neutral-800">
      {/* Barra superior */}
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* Izquierda: logo + nombre */}
          <div className="flex items-center gap-3">
            <Link to="/" className="inline-flex items-center gap-3" onClick={closeMenu}>
              <img src="/metso-logo.png" alt="Metso" className="h-10 w-auto" />
              <span className="font-semibold text-white">Metso-Transport</span>
            </Link>
          </div>

          {/* Centro (oculto en mobile): navegación */}
          <nav className="hidden md:flex items-center gap-4">
            {navItems.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={closeMenu}
                className={({ isActive }) =>
                  [
                    "text-sm px-3 py-2 rounded-md transition",
                    isActive
                      ? "text-white font-medium"
                      : "text-gray-300 hover:text-white hover:bg-neutral-800",
                  ].join(" ")
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Derecha: sesión + hamburguesa */}
          <div className="flex items-center gap-2">
            {user ? (
              <div className="hidden md:flex items-center gap-2">
                <span className="text-sm text-gray-300 truncate max-w-[10rem]">
                  {user.email ?? "Usuario"}
                </span>
                <button
                  onClick={logout}
                  className="text-sm rounded-md border border-gray-600 text-gray-200 px-3 py-1.5 hover:bg-neutral-800 hover:text-white"
                >
                  Salir
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden md:inline-flex text-sm rounded-md border border-gray-600 text-gray-200 px-3 py-1.5 hover:bg-neutral-800 hover:text-white"
              >
                Iniciar sesión
              </Link>
            )}

            {/* Botón hamburguesa (mobile) */}
            <button
              aria-label="Abrir menú"
              className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-600 hover:bg-neutral-800"
              onClick={() => setOpen((v) => !v)}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-5 w-5 text-white"
                aria-hidden="true"
              >
                {open ? (
                  <path
                    d="M6 18L18 6M6 6l12 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                ) : (
                  <path
                    d="M3 6h18M3 12h18M3 18h18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Menú desplegable mobile */}
      <div
        className={[
          "md:hidden overflow-hidden border-t border-neutral-800 bg-black transition-[max-height]",
          open ? "max-h-96" : "max-h-0",
        ].join(" ")}
      >
        <nav className="px-4 py-3">
          <ul className="flex flex-col gap-1">
            {navItems.map(({ to, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  onClick={closeMenu}
                  className={({ isActive }) =>
                    [
                      "block rounded-md px-3 py-2 text-sm",
                      isActive
                        ? "bg-neutral-800 text-white font-medium"
                        : "text-gray-300 hover:text-white hover:bg-neutral-800",
                    ].join(" ")
                  }
                >
                  {label}
                </NavLink>
              </li>
            ))}

            <li className="mt-2 pt-2 border-t border-neutral-800">
              {user ? (
                <button
                  onClick={() => { closeMenu(); logout(); }}
                  className="w-full text-left rounded-md px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-neutral-800"
                >
                  Salir
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={closeMenu}
                  className="block rounded-md px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-neutral-800"
                >
                  Iniciar sesión
                </Link>
              )}
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
