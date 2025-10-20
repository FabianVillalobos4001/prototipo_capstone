import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";

const baseItems = [
  { to: "/", label: "Inicio" },
  { to: "/request", label: "Solicitar viaje" },
  { to: "/estimates", label: "Estimaciones" },
];

export default function Header() {
  const { user, logout } = useAuth();

  // si hay usuario → /profile, si no → /login
  const userTabTo = user ? "/profile" : "/login";

  const navItems = [
    ...baseItems,
    { to: userTabTo, label: user ? "Perfil" : "Ingresar", isUser: true },
  ];

  return (
    <header className="sticky top-0 z-40 bg-black border-b border-neutral-800">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-3">
            <img src="/metso-logo.png" alt="Metso" className="h-10 w-auto" />
            <span className="font-semibold text-white">Metso-Transport</span>
          </Link>

          <nav className="hidden md:flex items-center gap-4">
            {navItems.map(({ to, label, isUser }) => (
              <NavLink
                key={to + label}
                to={to}
                className={({ isActive }) =>
                  [
                    "inline-flex items-center gap-2 text-sm px-3 py-2 rounded-md transition",
                    isActive
                      ? "text-white font-medium"
                      : "text-gray-300 hover:text-white hover:bg-neutral-800",
                  ].join(" ")
                }
              >
                {isUser && (
                  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" aria-hidden="true">
                    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
                    <path d="M4 21a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                )}
                {label}
              </NavLink>
            ))}

            {user && (
              <button
                onClick={logout}
                className="ml-2 text-sm px-3 py-2 rounded-md bg-neutral-800 text-gray-200 hover:text-white"
              >
                Cerrar sesión
              </button>
            )}
          </nav>

          <div className="md:hidden" />
        </div>
      </div>
    </header>
  );
}
