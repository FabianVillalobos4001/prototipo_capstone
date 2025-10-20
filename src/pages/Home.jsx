// src/pages/Home.jsx
import { useEffect, useState } from 'react'
import api from '../api/axios'

export default function Home(){
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    api.get('/trips/mine')
      .then(({data})=> setTrips(data))
      .finally(()=> setLoading(false))
  },[])

  if (loading) return <div className="p-4">Cargando…</div>

  return (
    <main className="p-4 max-w-md mx-auto grid gap-3">
      <h1 className="text-xl font-bold">Mis viajes planificados</h1>
      {trips.length === 0 && <p className="text-sm text-gray-500">Aún no tienes viajes.</p>}
      <ul className="grid gap-3">
        {trips.map(t => (
          <li key={t._id} className="rounded border p-3">
            <p className="font-medium">{t.origin?.address || 'Origen'} → {t.destination?.address || 'Destino'}</p>
            <p className="text-sm text-gray-600">
              Llega: {new Date(t.arrivalTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
              {' · '}Zona: {t.zone} {' · '}Estado: {t.status}
            </p>
            {t.groupId && (
              <div className="mt-2 text-xs rounded bg-emerald-50 border border-emerald-200 p-2">
                ✅ Match asignado. Vehículo: (simulado) · Pasajeros: n
              </div>
            )}
          </li>
        ))}
      </ul>
    </main>
  )
}
