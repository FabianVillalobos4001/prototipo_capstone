import { useEffect, useState } from "react";
import { useAuth } from "../features/auth/AuthContext";
import api from "../api/axios";

/* Flecha simple sin librerías */
function Chevron({ rotated }) {
  return (
    <span className={`inline-block transition-transform ${rotated ? "rotate-180" : ""}`} aria-hidden="true">
      ▼
    </span>
  );
}

function Avatar({ name = "Usuario", src }) {
  if (src) return <img src={src} alt={name} className="h-16 w-16 rounded-full object-cover" />;
  const initials = (name || "U").split(" ").map(n => n[0]?.toUpperCase()).slice(0,2).join("");
  return (
    <div className="h-16 w-16 rounded-full bg-neutral-800 text-white grid place-items-center text-lg font-semibold">
      {initials || "U"}
    </div>
  );
}

/* Controles de paginación reutilizables */
function Pager({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const pages = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  for (let p = start; p <= end; p++) pages.push(p);

  return (
    <div className="mt-3 flex items-center gap-2">
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="px-3 py-1 rounded border disabled:opacity-50"
      >
        ← Anterior
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`px-3 py-1 rounded border ${p === page ? "bg-black text-white" : "bg-white"}`}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="px-3 py-1 rounded border disabled:opacity-50"
      >
        Siguiente →
      </button>
    </div>
  );
}

export default function Profile() {
  const { user, logout } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [errorProfile, setErrorProfile] = useState(null);

  // planned (paginado)
  const [planned, setPlanned] = useState({ items: [], total: 0, page: 1, totalPages: 1 });
  const [plannedPage, setPlannedPage] = useState(1);
  const [openPlanned, setOpenPlanned] = useState(true);

  // completed (paginado)
  const [history, setHistory] = useState({ items: [], total: 0, page: 1, totalPages: 1 });
  const [historyPage, setHistoryPage] = useState(1);
  const [openHistory, setOpenHistory] = useState(true);

  // Perfil real (/api/auth/me) usando cookie JWT
  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    (async () => {
      setLoadingProfile(true);
      setErrorProfile(null);
      try {
        const { data } = await api.get("/auth/me", { signal: controller.signal });
        setProfile(data);
      } catch (e) {
        if (e.name !== "CanceledError" && e.name !== "AbortError") {
          setErrorProfile(e);
        }
      } finally {
        setLoadingProfile(false);
      }
    })();
    return () => controller.abort();
  }, [user]);

  // Carga planned
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const { data } = await api.get("/trips/me", {
          params: { status: "planned", limit: 10, page: plannedPage },
          signal: controller.signal,
        });
        setPlanned(data);
      } catch {
        setPlanned({ items: [], total: 0, page: 1, totalPages: 1 });
      }
    })();
    return () => controller.abort();
  }, [plannedPage]);

  // Carga completed
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const { data } = await api.get("/trips/me", {
          params: { status: "completed", limit: 10, page: historyPage },
          signal: controller.signal,
        });
        setHistory(data);
      } catch {
        setHistory({ items: [], total: 0, page: 1, totalPages: 1 });
      }
    })();
    return () => controller.abort();
  }, [historyPage]);

  if (!user) return null;

  if (loadingProfile) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-gray-600">Cargando perfil…</div>
      </main>
    );
  }
  if (errorProfile) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-red-600">Error: {errorProfile.message}</div>
      </main>
    );
  }

  const displayName = profile?.nombre || profile?.name || user?.name || "Usuario";
  const email = profile?.email || user?.email || "";
  const avatarUrl = profile?.fotoUrl || profile?.avatarUrl || user?.avatarUrl || "";

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-5xl flex flex-col items-center gap-8">
        {/* Cabecera */}
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-center sm:text-left">
          <Avatar name={displayName} src={avatarUrl} />
          <div>
            <h2 className="text-xl font-semibold">{displayName}</h2>
            <p className="text-sm text-gray-500">{email}</p>
          </div>
        </div>

        {/* Dos columnas: planned e históricos, ahora desplegables */}
        <div className="flex flex-col gap-6 w-full">
          {/* Próximos viajes (desplegable) */}
          <section className="border rounded-xl shadow-sm">
            <button
              type="button"
              onClick={() => setOpenPlanned((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3"
              aria-expanded={openPlanned}
            >
              <h3 className="text-lg font-semibold">Próximos viajes</h3>
              <Chevron rotated={openPlanned} />
            </button>

            {openPlanned && (
              <div className="px-4 pb-4">
                {planned.items.length === 0 ? (
                  <p className="text-sm text-gray-500">No hay viajes planificados.</p>
                ) : (
                  <>
                    <div className="space-y-3">
                      {planned.items.map((t) => (
                        <div key={t._id} className="flex justify-between items-start border-t border-gray-200 pt-2 first:border-none">
                          <div>
                            <p className="font-medium">{t.from} → {t.to}</p>
                            <p className="text-sm text-gray-500">
                              {t.date} {t.status ? `· ${t.status}` : ""}
                            </p>
                          </div>
                          <p className="text-sm font-medium">{t.price || "-"}</p>
                        </div>
                      ))}
                    </div>
                    <Pager page={planned.page} totalPages={planned.totalPages} onChange={setPlannedPage} />
                  </>
                )}
              </div>
            )}
          </section>

          {/* Viajes históricos (desplegable) */}
          <section className="border rounded-xl shadow-sm">
            <button
              type="button"
              onClick={() => setOpenHistory((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3"
              aria-expanded={openHistory}
            >
              <h3 className="text-lg font-semibold">Viajes históricos</h3>
              <Chevron rotated={openHistory} />
            </button>

            {openHistory && (
              <div className="px-4 pb-4">
                {history.items.length === 0 ? (
                  <p className="text-sm text-gray-500">No hay viajes registrados.</p>
                ) : (
                  <>
                    <div className="space-y-3">
                      {history.items.map((t) => (
                        <div key={t._id} className="flex justify-between items-start border-t border-gray-200 pt-2 first:border-none">
                          <div>
                            <p className="font-medium">{t.from} → {t.to}</p>
                            <p className="text-sm text-gray-500">
                              {t.date} {t.status ? `· ${t.status}` : "· Completado"}
                            </p>
                          </div>
                          <p className="text-sm font-medium">{t.price || "-"}</p>
                        </div>
                      ))}
                    </div>
                    <Pager page={history.page} totalPages={history.totalPages} onChange={setHistoryPage} />
                  </>
                )}
              </div>
            )}
          </section>
        </div>

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
