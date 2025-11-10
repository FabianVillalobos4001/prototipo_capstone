const API = import.meta.env.VITE_API_URL || "/api"; // usaremos proxy Vite o env

export async function getCurrentUser({ email } = {}) {
  const headers = { "Content-Type": "application/json" };

  // Si usas JWT en localStorage:
  const token = localStorage.getItem("token");
  if (token) headers.Authorization = `Bearer ${token}`;

  // Si aún no tienes auth, pasa email por query (?email=)
  const url = email ? `${API}/me?email=${encodeURIComponent(email)}` : `${API}/me`;

  const res = await fetch(url, { headers, credentials: "include" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}
