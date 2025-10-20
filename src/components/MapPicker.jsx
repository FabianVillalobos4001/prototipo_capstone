// src/components/MapPicker.jsx
import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'

const SANTIAGO = { lat: -33.4489, lng: -70.6693 }
const TILE = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

export default function MapPicker({ origin, destination, onPick }) {
  const mapRef = useRef(null)
  const mapEl = useRef(null)
  const [mode, setMode] = useState('origin') // 'origin' | 'destination'
  const originRef = useRef(null)
  const destRef = useRef(null)

  useEffect(() => {
    if (mapRef.current) return
    const map = L.map(mapEl.current, { center: SANTIAGO, zoom: 12 })
    L.tileLayer(TILE, { attribution: '&copy; OpenStreetMap' }).addTo(map)

    // click handler
    map.on('click', (e) => {
      const { lat, lng } = e.latlng
      if (mode === 'origin') {
        if (originRef.current) originRef.current.remove()
        originRef.current = L.circleMarker([lat, lng], { radius: 8, weight: 2 })
          .addTo(map)
        onPick({ type: 'origin', value: { lat, lng, label: `${lat.toFixed(5)}, ${lng.toFixed(5)}` } })
      } else {
        if (destRef.current) destRef.current.remove()
        destRef.current = L.circleMarker([lat, lng], { radius: 8, weight: 2, dashArray: '4 3' })
          .addTo(map)
        onPick({ type: 'destination', value: { lat, lng, label: `${lat.toFixed(5)}, ${lng.toFixed(5)}` } })
      }
    })

    mapRef.current = map
  }, [mode, onPick])

  // Si nos pasan coords desde fuera, dibújalas
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (origin?.lat && origin?.lng) {
      if (originRef.current) originRef.current.remove()
      originRef.current = L.circleMarker([origin.lat, origin.lng], { radius: 8, weight: 2 })
        .addTo(map)
    }
    if (destination?.lat && destination?.lng) {
      if (destRef.current) destRef.current.remove()
      destRef.current = L.circleMarker([destination.lat, destination.lng], { radius: 8, weight: 2, dashArray: '4 3' })
        .addTo(map)
    }
  }, [origin, destination])

  return (
    <div className="grid gap-2">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode('origin')}
          className={`px-3 py-1.5 rounded-lg border ${mode==='origin'?'bg-black text-white':'bg-white'}`}
        >
          Marcar Origen
        </button>
        <button
          type="button"
          onClick={() => setMode('destination')}
          className={`px-3 py-1.5 rounded-lg border ${mode==='destination'?'bg-black text-white':'bg-white'}`}
        >
          Marcar Destino
        </button>
      </div>
      <div ref={mapEl} className="w-full h-72 rounded-xl overflow-hidden border" />
      <p className="text-xs text-black/60">
        Tip: haz clic en el mapa para fijar {mode === 'origin' ? 'el origen' : 'el destino'}.
      </p>
    </div>
  )
}
