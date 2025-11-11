// src/components/MapPickerModal.jsx
import { useEffect, useRef, useState } from 'react'
import { reverseGeocode } from '../lib/geocoding'
import 'leaflet/dist/leaflet.css'

export default function MapPickerModal({ open, onClose, initialValue, title = 'Elegir ubicación', onConfirm }) {
  const elRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const [selected, setSelected] = useState(initialValue || null)
  const [disp, setDisp] = useState(initialValue?.address || '')

  useEffect(() => {
    setSelected(initialValue || null)
    setDisp(initialValue?.address || '')
  }, [initialValue, open])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    ;(async () => {
      const leaflet = await import('leaflet')
      const L = leaflet.default || leaflet
      if (!elRef.current) return

      // limpia instancia previa
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }

      const center = initialValue?.lat ? [initialValue.lat, initialValue.lng] : [-33.45, -70.65]
      const map = L.map(elRef.current, { center, zoom: 13 })
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19, attribution: '&copy; OpenStreetMap',
      }).addTo(map)
      const marker = L.marker(center, { draggable: true }).addTo(map)

      async function setFrom(latlng) {
        const { lat, lng } = latlng
        const { address } = await reverseGeocode(lat, lng)
        setSelected({ lat, lng, address })
        setDisp(address)
      }

      marker.on('moveend', (e) => setFrom(e.target.getLatLng()))
      map.on('click', (e) => { marker.setLatLng(e.latlng); setFrom(e.latlng) })

      mapRef.current = map
      markerRef.current = marker
    })()
    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
      markerRef.current = null
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-0 md:p-6">
      <div className="bg-white rounded-t-2xl md:rounded-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold">{title}</h3>
          <button onClick={onClose} className="text-sm px-2 py-1 rounded hover:bg-neutral-100">Cerrar</button>
        </div>

        <div className="p-3">
          <div ref={elRef} className="w-full h-72 rounded-lg overflow-hidden border" />

          <p className="text-xs text-gray-600 mt-2 min-h-5">
            {disp ? `Dirección estimada: ${disp}` : 'Toca el mapa para elegir un punto'}
          </p>

          <div className="mt-3 flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded border">Cancelar</button>
            <button
              onClick={() => { if (selected) onConfirm?.(selected); onClose?.() }}
              disabled={!selected}
              className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
            >
              Confirmar ubicación
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
