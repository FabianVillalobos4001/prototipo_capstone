// RequestTrip.jsx (tu archivo con cambios marcados)
import { useNavigate, Link } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../features/auth/AuthContext'
import Input from '../components/Input'
import Select from '../components/Select'
import Button from '../components/Button'
import MapPicker from '../components/MapPicker'   // 👈 nuevo
import { estimateTrip } from '../api/trips'

const ZONES = [
  { value: 'norte', label: 'Zona Norte' },
  { value: 'centro', label: 'Zona Centro' },
  { value: 'sur',   label: 'Zona Sur' },
]

export default function RequestTrip() {
  const nav = useNavigate()
  const { user } = useAuth?.() ?? { user: null }

  // 🔹 extendemos el form para incluir coords + labels
  const [form, setForm] = useState({
    origin: '', destination: '', time: '', zone: 'centro',
    originCoords: null, destinationCoords: null
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onChange = (k) => (e) => setForm(v => ({ ...v, [k]: e.target.value }))

  // recibe clicks del mapa
  const handlePick = ({ type, value }) => {
    if (type === 'origin') {
      setForm(v => ({ ...v, origin: value.label, originCoords: { lat: value.lat, lng: value.lng } }))
    } else {
      setForm(v => ({ ...v, destination: value.label, destinationCoords: { lat: value.lat, lng: value.lng } }))
    }
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!user) {
      nav('/login', { state: { from: '/request' } })
      return
    }

    // Validación mínima: necesitamos al menos coords de ambos
    if (!form.originCoords || !form.destinationCoords) {
      setError('Selecciona origen y destino en el mapa (o completa las direcciones).')
      return
    }

    setLoading(true)
    try {
      const res = await estimateTrip({
        origin: form.origin,
        destination: form.destination,
        originCoords: form.originCoords,
        destinationCoords: form.destinationCoords,
        time: form.time,
        zone: form.zone
      })
      nav('/estimates', { state: { estimates: res.data, criteria: form } })
    } catch (e) {
      setError('No fue posible obtener estimaciones')
    } finally { setLoading(false) }
  }

  return (
    <main className="min-h-screen p-4 grid gap-4 max-w-xl mx-auto">
      <h1 className="text-xl font-bold">Solicitud de viaje</h1>

      {!user && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          Debes <Link to="/login" className="underline">iniciar sesión</Link> para enviar la solicitud.
          Puedes completar el formulario y te llevamos al login al momento de enviar.
        </div>
      )}

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {/* 🗺️ Mapa */}
      <MapPicker
        origin={form.originCoords}
        destination={form.destinationCoords}
        onPick={handlePick}
      />

      <form onSubmit={onSubmit} className="grid gap-3">
        <Input label="Origen" value={form.origin} onChange={onChange('origin')} required />
        <Input label="Destino" value={form.destination} onChange={onChange('destination')} required />
        <Input label="Horario (HH:MM)" type="time" value={form.time} onChange={onChange('time')} required />
        <Select label="Zona" value={form.zone} onChange={onChange('zone')} options={ZONES} />

        <Button type="submit" disabled={loading}>
          {loading ? 'Consultando…' : 'Obtener estimación'}
        </Button>
      </form>
    </main>
  )
}
