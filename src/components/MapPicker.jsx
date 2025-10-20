// src/components/MapPicker.jsx
import { useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'

// util opcional
async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    )
    const data = await res.json()
    return data?.display_name || ''
  } catch {
    return ''
  }
}

export default function MapPicker({ value, onChange, height = '18rem' }) {
  const elRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      // importa leaflet dinámicamente para evitar issues en build
      const leaflet = await import('leaflet')
      const L = leaflet.default || leaflet
      if (cancelled || !elRef.current || mapRef.current) return

      const map = L.map(elRef.current, { center: [-33.45, -70.65], zoom: 12 })
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap',
      }).addTo(map)

      const start = value?.lat ? [value.lat, value.lng] : map.getCenter()
      const marker = L.marker(start, { draggable: true }).addTo(map)

      marker.on('moveend', async (e) => {
        const { lat, lng } = e.target.getLatLng()
        const address = await reverseGeocode(lat, lng)
        onChange?.({ lat, lng, address })
      })

      map.on('click', async (e) => {
        marker.setLatLng(e.latlng)
        const { lat, lng } = e.latlng
        const address = await reverseGeocode(lat, lng)
        onChange?.({ lat, lng, address })
      })

      mapRef.current = map
      markerRef.current = marker
    })()

    return () => {
      cancelled = true
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        markerRef.current = null
      }
    }
  }, [])

  // si el valor cambia desde fuera, mueve el marcador
  useEffect(() => {
    if (value?.lat && markerRef.current) {
      markerRef.current.setLatLng([value.lat, value.lng])
    }
  }, [value?.lat, value?.lng])

  return (
    <div
      ref={elRef}
      style={{ height }}
      className="w-full rounded-xl overflow-hidden border"
    />
  )
}
