import { useEffect, useState } from "react";
import { useAuth } from "../features/auth/AuthContext";
import api from "../api/axios";

/* Flecha simple sin librerias */
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

/* Controles de paginacion reutilizables */
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
  const { user, logout, refreshUser } = useAuth();

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
  const [contactForm, setContactForm] = useState({
    phone: "",
    contactMethod: "phone",
    chatHandle: "",
    contactNote: "",
    shareContact: false,
  });
  const [contactSaving, setContactSaving] = useState(false);
  const [contactFeedback, setContactFeedback] = useState(null);
  const [nameValue, setNameValue] = useState("");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameFeedback, setNameFeedback] = useState(null);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState(null);

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

  useEffect(() => {
    if (!profile) return;
    setContactForm({
      phone: profile.phone || "",
      contactMethod: profile.carpoolContactMethod || "phone",
      chatHandle: profile.carpoolChatHandle || "",
      contactNote: profile.carpoolContactNote || "",
      shareContact: Boolean(profile.carpoolContactEnabled),
    });
    setNameValue(profile.name || "");
  }, [profile]);

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

  const updateContactForm = (field, value) => {
    setContactForm((prev) => ({ ...prev, [field]: value }));
    setContactFeedback(null);
  };

  const handleContactSubmit = async (event) => {
    event.preventDefault();
    const trimmedPhone = (contactForm.phone || "").trim();
    const trimmedChat = (contactForm.chatHandle || "").trim();
    const trimmedNote = (contactForm.contactNote || "").trim();
    const needsValue = contactForm.contactMethod === "phone" ? trimmedPhone : trimmedChat;
    if (contactForm.shareContact && needsValue.length === 0) {
      setContactFeedback({ type: "error", message: "Agrega un numero o chat antes de compartirlo." });
      return;
    }
    setContactSaving(true);
    setContactFeedback(null);
    try {
      const { data } = await api.patch("/auth/contact", {
        phone: trimmedPhone,
        chatHandle: trimmedChat,
        contactNote: trimmedNote,
        contactMethod: contactForm.contactMethod,
        shareContact: contactForm.shareContact,
      });
      setProfile((prev) => ({ ...prev, ...data }));
      setContactForm({
        phone: data.phone || "",
        contactMethod: data.carpoolContactMethod || "phone",
        chatHandle: data.carpoolChatHandle || "",
        contactNote: data.carpoolContactNote || "",
        shareContact: Boolean(data.carpoolContactEnabled),
      });
      if (refreshUser) {
        try {
          await refreshUser();
        } catch {
          // ignore
        }
      }
      setContactFeedback({ type: "success", message: "Preferencias de contacto guardadas." });
    } catch (error) {
      const msg = error?.response?.data?.error || "No se pudo guardar el contacto.";
      setContactFeedback({ type: "error", message: msg });
    } finally {
      setContactSaving(false);
    }
  };

  const handleNameSubmit = async (event) => {
    event.preventDefault();
    if (!nameValue.trim()) {
      setNameFeedback({ type: "error", message: "El nombre no puede estar vacio." });
      return;
    }
    setNameSaving(true);
    setNameFeedback(null);
    try {
      const { data } = await api.patch("/auth/profile", { name: nameValue.trim() });
      setProfile((prev) => ({ ...prev, ...data }));
      setNameFeedback({ type: "success", message: "Nombre actualizado." });
    } catch (error) {
      const msg = error?.response?.data?.error || "No se pudo actualizar el nombre.";
      setNameFeedback({ type: "error", message: msg });
    } finally {
      setNameSaving(false);
    }
  };

  const updatePasswordForm = (field, value) => {
    setPasswordForm((prev) => ({ ...prev, [field]: value }));
    setPasswordFeedback(null);
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setPasswordFeedback({ type: "error", message: "Completa ambos campos." });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordFeedback({ type: "error", message: "Las contrasenas no coinciden." });
      return;
    }
    setPasswordSaving(true);
    setPasswordFeedback(null);
    try {
      await api.patch("/auth/password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordFeedback({ type: "success", message: "Contrasena actualizada." });
    } catch (error) {
      const msg = error?.response?.data?.error || "No se pudo actualizar la contrasena.";
      setPasswordFeedback({ type: "error", message: msg });
    } finally {
      setPasswordSaving(false);
    }
  };

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

        {/* Actualizar nombre */}
        <section className="w-full border rounded-xl shadow-sm p-4 space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Nombre visible</h3>
            <p className="text-sm text-gray-600">
              Personaliza el nombre que veran tus companeros en los viajes compartidos.
            </p>
          </div>
          <form className="space-y-3" onSubmit={handleNameSubmit}>
            <label className="text-sm font-medium space-y-1 w-full">
              Nombre completo
              <input
                type="text"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                className="w-full rounded border px-3 py-2 text-sm"
                placeholder="Ej: Maria Gomez"
              />
            </label>
            {nameFeedback && (
              <p className={`text-sm ${nameFeedback.type === "success" ? "text-emerald-600" : "text-red-600"}`}>
                {nameFeedback.message}
              </p>
            )}
            <button
              type="submit"
              className="w-full md:w-auto px-5 py-2 rounded-lg bg-black text-white text-sm font-medium disabled:opacity-60"
              disabled={nameSaving}
            >
              {nameSaving ? "Guardando..." : "Guardar nombre"}
            </button>
          </form>
        </section>

        {/* Contacto para viajes compartidos */}
        <section className="w-full border rounded-xl shadow-sm p-4 space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Contacto para viajes compartidos</h3>
            <p className="text-sm text-gray-600">
              Define si prefieres coordinar por telefono o chat cuando te unas a un grupo de match.
            </p>
          </div>
          <form className="space-y-4" onSubmit={handleContactSubmit}>
            <div>
              <p className="text-sm font-medium">Prefiero coordinar por</p>
              <div className="mt-2 flex flex-wrap gap-3">
                <label
                  className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm cursor-pointer ${contactForm.contactMethod === "phone" ? "bg-black text-white border-black" : ""}`}
                >
                  <input
                    type="radio"
                    name="contactMethod"
                    value="phone"
                    checked={contactForm.contactMethod === "phone"}
                    onChange={() => updateContactForm("contactMethod", "phone")}
                    className="hidden"
                  />
                  Telefono
                </label>
                <label
                  className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm cursor-pointer ${contactForm.contactMethod === "chat" ? "bg-black text-white border-black" : ""}`}
                >
                  <input
                    type="radio"
                    name="contactMethod"
                    value="chat"
                    checked={contactForm.contactMethod === "chat"}
                    onChange={() => updateContactForm("contactMethod", "chat")}
                    className="hidden"
                  />
                  Chat / enlace
                </label>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-medium space-y-1">
                Telefono
                <input
                  type="tel"
                  value={contactForm.phone}
                  onChange={(e) => updateContactForm("phone", e.target.value)}
                  className="w-full rounded border px-3 py-2 text-sm"
                  placeholder="+56 9 1234 5678"
                  disabled={contactForm.contactMethod !== "phone"}
                />
              </label>
              <label className="text-sm font-medium space-y-1">
                Chat o enlace (Teams, WhatsApp, etc.)
                <input
                  type="text"
                  value={contactForm.chatHandle}
                  onChange={(e) => updateContactForm("chatHandle", e.target.value)}
                  className="w-full rounded border px-3 py-2 text-sm"
                  placeholder="Ej: @usuario o https://chat"
                  disabled={contactForm.contactMethod !== "chat"}
                />
              </label>
            </div>

            <label className="text-sm font-medium space-y-1">
              Nota para tu equipo (opcional)
              <textarea
                rows={3}
                value={contactForm.contactNote}
                onChange={(e) => updateContactForm("contactNote", e.target.value)}
                className="w-full rounded border px-3 py-2 text-sm resize-none"
                placeholder="Ej: Disponible despues de las 7:30 o prefiero mensajes."
              />
            </label>

            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={contactForm.shareContact}
                onChange={(e) => updateContactForm("shareContact", e.target.checked)}
                className="mt-1"
              />
              Compartir este dato automaticamente con los companeros del grupo cada vez que me una a un viaje.
            </label>

            {contactFeedback && (
              <p className={`text-sm ${contactFeedback.type === "success" ? "text-emerald-600" : "text-red-600"}`}>
                {contactFeedback.message}
              </p>
            )}

            <button
              type="submit"
              className="w-full md:w-auto px-5 py-2 rounded-lg bg-black text-white text-sm font-medium disabled:opacity-60"
              disabled={contactSaving}
            >
              {contactSaving ? "Guardando..." : "Guardar preferencia"}
            </button>
          </form>
        </section>

        {/* Actualizar contrasena */}
        <section className="w-full border rounded-xl shadow-sm p-4 space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Actualizar contrasena</h3>
            <p className="text-sm text-gray-600">
              Cambia tu contrasena. Asegurate de recordar la nueva clave.
            </p>
          </div>
          <form className="space-y-4" onSubmit={handlePasswordSubmit}>
            <label className="text-sm font-medium space-y-1 w-full">
              Contrasena actual
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => updatePasswordForm("currentPassword", e.target.value)}
                className="w-full rounded border px-3 py-2 text-sm"
                placeholder="Tu contrasena actual"
              />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-medium space-y-1">
                Nueva contrasena
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => updatePasswordForm("newPassword", e.target.value)}
                  className="w-full rounded border px-3 py-2 text-sm"
                  placeholder="Minimo 6 caracteres"
                />
              </label>
              <label className="text-sm font-medium space-y-1">
                Confirmar nueva contrasena
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => updatePasswordForm("confirmPassword", e.target.value)}
                  className="w-full rounded border px-3 py-2 text-sm"
                  placeholder="Repite la contrasena"
                />
              </label>
            </div>
            {passwordFeedback && (
              <p className={`text-sm ${passwordFeedback.type === "success" ? "text-emerald-600" : "text-red-600"}`}>
                {passwordFeedback.message}
              </p>
            )}
            <button
              type="submit"
              className="w-full md:w-auto px-5 py-2 rounded-lg bg-black text-white text-sm font-medium disabled:opacity-60"
              disabled={passwordSaving}
            >
              {passwordSaving ? "Actualizando..." : "Actualizar contrasena"}
            </button>
          </form>
        </section>

        {/* Dos columnas: planned e historicos, ahora desplegables */}
        <div className="flex flex-col gap-6 w-full">
          {/* Proximos viajes (desplegable) */}
          <section className="border rounded-xl shadow-sm">
            <button
              type="button"
              onClick={() => setOpenPlanned((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3"
              aria-expanded={openPlanned}
            >
              <h3 className="text-lg font-semibold">Proximos viajes</h3>
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

          {/* Viajes historicos (desplegable) */}
          <section className="border rounded-xl shadow-sm">
            <button
              type="button"
              onClick={() => setOpenHistory((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3"
              aria-expanded={openHistory}
            >
              <h3 className="text-lg font-semibold">Viajes historicos</h3>
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
          Cerrar sesion
        </button>
      </div>
    </main>
  );
}
