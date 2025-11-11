import api from "./axios"; // 👈 usa tu instancia axios con baseURL y cookies

// Trae el usuario autenticado usando cookie JWT
export async function getCurrentUser() {
  try {
    const { data } = await api.get("/auth/me"); // -> /api/auth/me en tu backend
    return data;
  } catch (error) {
    // Maneja error HTTP o de red
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw new Error(`Error al obtener usuario: ${error.message}`);
  }
}
