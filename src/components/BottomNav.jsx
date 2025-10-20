import { NavLink } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";

const tabsBase = [
  { to: "/", label: "Inicio", icon: HomeIcon },
  { to: "/request", label: "Solicitar", icon: RequestIcon },
  { to: "/estimates", label: "Estimaciones", icon: EstimateIcon },
];

export default function BottomNav() {
  const { user } = useAuth?.() ?? { user: null };

  // Último tab: siempre "Usuario". Si luego agregas /profile, aquí lo puedes cambiar con user ? "/profile" : "/login"
  const userTab = { to: "/login", label: "Usuario", icon: UserIcon };

  const tabs = [...tabsBase, userTab];

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-black/95 backdrop-blur border-t border-neutral-800">
      <ul className="grid grid-cols-4">
        {tabs.map(({ to, label, icon: Icon }) => (
          <li key={to} className="contents">
            <NavLink
              to={to}
              className={({ isActive }) =>
                [
                  "flex flex-col items-center justify-center gap-1 py-2 text-xs",
                  "transition-colors",
                  isActive ? "text-white" : "text-gray-400 hover:text-white",
                ].join(" ")
              }
            >
              <Icon className="h-5 w-5" />
              <span className="leading-none">{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
      {/* safe-area para iOS */}
      <div className="h-[env(safe-area-inset-bottom,0)]" />
    </nav>
  );
}

/* ====== Iconos (SVG inline) ====== */
function HomeIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-10.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function RequestIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path d="M4 7h16M4 12h12M4 17h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}
function EstimateIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path d="M4 19V5a1 1 0 0 1 1-1h8l7 7v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z" stroke="currentColor" strokeWidth="2"/>
      <path d="M13 4v6h6" stroke="currentColor" strokeWidth="2"/>
      <path d="M8 15h8M8 11h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}
function UserIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
      <path d="M4 21a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
