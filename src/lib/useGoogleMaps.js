import { useEffect, useState } from 'react'

export function useGoogleMaps() {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (window.google?.maps) { setLoaded(true); return }

    const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    if (!key) { setError(new Error('Falta VITE_GOOGLE_MAPS_API_KEY')); return }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&language=es&region=CL`
    script.async = true
    script.onload = () => setLoaded(true)
    script.onerror = () => setError(new Error('No se pudo cargar Google Maps'))
    document.head.appendChild(script)

    return () => { script.remove() }
  }, [])

  return { loaded, error }
}
