import { useEffect } from 'react'

export default function useGoogleMaps() {
  useEffect(() => {
    // Evitar múltiples cargas
    if (window.google?.maps) return

    const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    if (!key) {
      console.error('⚠️ Falta VITE_GOOGLE_MAPS_API_KEY en el .env')
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&language=es&region=CL`
    script.async = true
    script.defer = true
    document.body.appendChild(script)

    return () => {
      // Limpieza opcional
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [])
}
