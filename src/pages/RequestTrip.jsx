// src/pages/RequestTrip.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import api from '../api/axios'
import GoogleAddressAutocomplete from '../components/GoogleAddressAutocomplete'
import MapPickerModal from '../components/MapPickerModal'

export default function RequestTrip() {
  const { user } = useAuth()
  const nav = useNavigate()

  const [origin, setOrigin] = useState(null)       // {address,lat,lng,placeId}
  const [destination, setDestination] = useState(null)
  const [date, setDate] = useState(() => todayYYYYMMDD()) // "YYYY-MM-DD"
  const [time, setTime] = useState('')             // "HH:MM"
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const [mapOpen, setMapOpen] = useState(false)
  const [mapMode, setMapMode] = useState('origin')

  const openMapFor = (mode) => { setMapMode(mode); setMapOpen(true) }

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    if (!user) return nav('/login', { state: { from: '/request' } })

    if (!origin || !destination || !date || !time) {
      setErr('Completa origen, destino, fecha y hora'); 
      return
    }

    setSaving(true)
    try {
      // Construye Date local con fecha + hora (sin mover por zona horaria)
      const arrivalTime = buildLocalDateISO(date, time) // ISO string

      await api.post('/trips', {
        origin, destination, arrivalTime, bufferMinutes: 20,
      })

      nav('/') // Home
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || 'No se pudo guardar el viaje'
      setErr(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="p-4 grid gap-4 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold">Planificar viaje</h1>
      {err && <p className="text-red-600 text-sm">{err}</p>}

      {/* Origen */}
      <div className="grid gap-2">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <GoogleAddressAutocomplete
              label="Origen"
              value={origin}
              onChange={setOrigin}
              types={['geocode']}
              country="cl"
              placeholder="Ej: Apoquindo 3000, Las Condes"
            />
          </div>
          <button type="button" onClick={() => openMapFor('origin')}
            className="h-10 px-3 rounded bg-neutral-900 text-white text-sm">🗺️ Mapa</button>
        </div>
        {origin?.address && <p className="text-xs text-gray-500">Seleccionado: {origin.address}</p>}
      </div>

      {/* Destino */}
      <div className="grid gap-2">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <GoogleAddressAutocomplete
              label="Destino"
              value={destination}
              onChange={setDestination}
              types={['establishment']}  // mejor para “Aeropuerto…”, “Planta…”
              country="cl"
              placeholder="Ej: Aeropuerto de Santiago"
            />
          </div>
          <button type="button" onClick={() => openMapFor('destination')}
            className="h-10 px-3 rounded bg-neutral-900 text-white text-sm">🗺️ Mapa</button>
        </div>
        {destination?.address && <p className="text-xs text-gray-500">Seleccionado: {destination.address}</p>}
      </div>

      {/* Fecha y Hora */}
      <form onSubmit={submit} className="grid gap-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Fecha</label>
            <input type="date" className="border rounded p-2 w-full"
                   value={date} onChange={e=>setDate(e.target.value)} required />
          </div>
          <div>
            <label className="text-sm font-medium">Hora de llegada</label>
            <input type="time" className="border rounded p-2 w-full"
                   value={time} onChange={e=>setTime(e.target.value)} required />
          </div>
        </div>

        <button disabled={saving} className="mt-2 rounded bg-black text-white py-2">
          {saving ? 'Guardando…' : 'Confirmar viaje'}
        </button>
      </form>

      {/* Modal de mapa */}
      <MapPickerModal
        open={mapOpen}
        onClose={() => setMapOpen(false)}
        initialValue={mapMode === 'origin' ? origin : destination}
        title={mapMode === 'origin' ? 'Elegir punto de partida' : 'Elegir destino'}
        onConfirm={(point) => {
          if (mapMode === 'origin') setOrigin(point)
          else setDestination(point)
        }}
      />
    </main>
  )
}

/* Utils */
function todayYYYYMMDD() {
  const d = new Date()
  const mm = String(d.getMonth()+1).padStart(2,'0')
  const dd = String(d.getDate()).padStart(2,'0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

// Crea un ISO sin sorpresas de zona horaria: usa componentes locales
function buildLocalDateISO(dateStr, timeStr) {
  const [y,m,d] = dateStr.split('-').map(Number)
  const [hh,mm] = timeStr.split(':').map(Number)
  const dt = new Date(y, m-1, d, hh, mm, 0, 0)
  return dt.toISOString()
}
