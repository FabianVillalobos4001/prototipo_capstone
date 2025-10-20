// src/pages/RequestTrip.jsx (fragmentos relevantes)
import MapPicker from '../components/MapPicker'
import api from '../api/axios'
import { useAuth } from '../features/auth/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

export default function RequestTrip(){
  const { user } = useAuth()
  const nav = useNavigate()
  const [origin, setOrigin] = useState(null)
  const [destination, setDestination] = useState(null)
  const [arrivalTime, setArrivalTime] = useState('')
  const [zone, setZone] = useState('centro')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const submit = async (e)=>{
    e.preventDefault()
    if(!user) return nav('/login',{state:{from:'/request'}})
    if(!origin || !destination || !arrivalTime) { setErr('Completa todos los campos'); return }
    setSaving(true)
    try{
      const iso = new Date(`${arrivalTime}:00Z`) // o combínalo con fecha elegida
      await api.post('/trips', { origin, destination, arrivalTime: iso, zone, bufferMinutes: 20 })
      nav('/') // vuelve al Home
    }catch(e){ setErr('No se pudo guardar el viaje') }
    finally{ setSaving(false) }
  }

  return (
    <main className="p-4 grid gap-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold">Planificar viaje</h1>
      {err && <p className="text-red-600 text-sm">{err}</p>}

      <div className="grid gap-3">
        <label className="text-sm font-medium">Origen</label>
        <MapPicker value={origin} onChange={setOrigin} />
        <p className="text-xs text-gray-500">{origin?.address || 'Toca el mapa para seleccionar'}</p>
      </div>

      <div className="grid gap-3">
        <label className="text-sm font-medium">Destino</label>
        <MapPicker value={destination} onChange={setDestination} />
        <p className="text-xs text-gray-500">{destination?.address || 'Toca el mapa para seleccionar'}</p>
      </div>

      <form onSubmit={submit} className="grid gap-3">
        <label className="text-sm font-medium">Hora de llegada</label>
        <input type="time" className="border rounded p-2" value={arrivalTime} onChange={e=>setArrivalTime(e.target.value)} required />

        <label className="text-sm font-medium">Zona</label>
        <select className="border rounded p-2" value={zone} onChange={e=>setZone(e.target.value)}>
          <option value="norte">Zona Norte</option>
          <option value="centro">Zona Centro</option>
          <option value="sur">Zona Sur</option>
        </select>

        <button disabled={saving} className="mt-2 rounded bg-black text-white py-2">
          {saving ? 'Guardando…' : 'Guardar planificación'}
        </button>
      </form>
    </main>
  )
}
