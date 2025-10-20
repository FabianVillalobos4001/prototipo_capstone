import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import Input from '../components/Input'
import Select from '../components/Select'
import Button from '../components/Button'
import { estimateTrip } from '../api/trips'

const ZONES = [
  { value: 'norte', label: 'Zona Norte' },
  { value: 'centro', label: 'Zona Centro' },
  { value: 'sur',   label: 'Zona Sur' },
]

export default function RequestTrip() {
  const nav = useNavigate()
  const [form, setForm] = useState({ origin: '', destination: '', time: '', zone: 'centro' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onChange = (k) => (e) => setForm(v => ({ ...v, [k]: e.target.value }))

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await estimateTrip(form)
      nav('/estimates', { state: { estimates: res.data, criteria: form } })
    } catch (e) {
      setError('No fue posible obtener estimaciones')
    } finally { setLoading(false) }
  }

  return (
    <main className="min-h-screen p-4 grid gap-4">
      <h1 className="text-xl font-bold">Solicitud de viaje</h1>
      {error && <p className="text-red-600 text-sm">{error}</p>}

      <form onSubmit={onSubmit} className="grid gap-3">
        <Input label="Origen" value={form.origin} onChange={onChange('origin')} required />
        <Input label="Destino" value={form.destination} onChange={onChange('destination')} required />
        <Input label="Horario (HH:MM)" type="time" value={form.time} onChange={onChange('time')} required />
        <Select label="Zona" value={form.zone} onChange={onChange('zone')} options={ZONES} />
        <Button type="submit" disabled={loading}>{loading ? 'Consultando…' : 'Obtener estimación'}</Button>
      </form>
    </main>
  )
}
