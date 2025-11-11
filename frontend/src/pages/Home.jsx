// src/pages/Home.jsx
import { useEffect, useState } from 'react'
import api from '../api/axios'
import RouteMap from '../components/RouteMap'

export default function Home(){
  const [myTrips, setMyTrips] = useState([])
  const [sugs, setSugs]     = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  // 1) Cargar mis viajes
  useEffect(() => {
    setLoading(true)
    api.get('/trips/mine')
      .then(({data}) => setMyTrips(data || []))
      .catch(() => setErr('No fue posible cargar tus viajes'))
      .finally(() => setLoading(false))
  }, [])

  // 2) Detectar mi próximo viaje y pedir sugerencias
  const now = new Date()
  const futureTrips = myTrips.filter(t => new Date(t.arrivalTime) > now)
  const upcoming = [...futureTrips]
    .filter(t => t.status === 'planned')
    .sort((a,b)=> new Date(a.arrivalTime) - new Date(b.arrivalTime))[0]

  useEffect(() => {
    if (!upcoming) { setSugs([]); return }
    api.get('/match/suggestions', { params: { tripId: upcoming._id } })
      .then(({data}) => setSugs(data || []))
      .catch(() => setSugs([]))
  }, [upcoming?._id])

  // 3) Unirme
  const join = async (otherTripId) => {
    if (!upcoming) return
    try {
      const { data } = await api.post('/match/join', { tripId: upcoming._id, otherTripId })
      if (data?.ok) {
        // refresca mis viajes y sugerencias
        const { data: mine } = await api.get('/trips/mine')
        setMyTrips(mine || [])
        setSugs([])
      }
    } catch (e) {
      setErr(e?.response?.data?.error || 'No fue posible unirse al grupo')
    }
  }

  if (loading) return <div className="p-4">Cargando…</div>

  return (
    <main className="p-4 pb-28 max-w-md mx-auto grid gap-4">
      <h1 className="text-xl font-bold">Mis viajes planificados</h1>
      {err && <p className="text-red-600 text-sm">{err}</p>}

      {/* Sugerencias de matching para el próximo viaje */}
      {upcoming ? (
        <>
         <p className="text-sm text-gray-600">
           Próximo viaje: {formatDateTime(upcoming.arrivalTime)}
           {' · '}Destino: {upcoming.destination?.address}
            {tripZoneLabel(upcoming) ? ` · Ruta: ${tripZoneLabel(upcoming)}` : ''}
         </p>

          {sugs.length > 0 && (
            <section className="rounded-lg border p-3">
              <h2 className="font-semibold mb-2">Posibles matchings</h2>
              <ul className="grid gap-2">
                {sugs.map(s => (
                  <li key={s.tripId} className="border rounded p-2 flex items-center justify-between">
                    <div>
                      <p className="text-sm">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-neutral-900 text-white text-xs mr-2">
                          {s.user.initials}
                        </span>
                        {s.user.name} · llega {formatDateTime(s.arrivalTime)}
                      </p>
                      <p className="text-xs text-gray-500 truncate max-w-[16rem]">
                        {s.destination?.address}
                      </p>
                    </div>
                    <button
                      onClick={() => join(s.tripId)}
                      className="w-9 h-9 rounded-full bg-emerald-600 text-white text-lg"
                      title="Unirme"
                    >
                      +
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      ) : (
        <p className="text-sm text-gray-500">No tienes viajes próximos. Planifica uno para ver coincidencias.</p>
      )}

      {/* Lista de mis viajes */}
      <ul className="grid gap-3">
        {futureTrips.length === 0 && (
          <li className="rounded border p-3 text-sm text-gray-500">
            No hay viajes planificados en el futuro.
          </li>
        )}
        {futureTrips.map(t => (
          <li key={t._id} className="rounded border p-3">
           <p className="font-medium">{t.origin?.address || 'Origen'} · {t.destination?.address || 'Destino'}</p>
            <p className="text-sm text-gray-600">
              Llega: {formatDateTime(t.arrivalTime)}
              {tripZoneLabel(t) ? ` · Ruta: ${tripZoneLabel(t)}` : ''}
              {' · '}Estado: {t.status}
            </p>
            {t.groupId && <GroupMini groupId={t.groupId} />}
          </li>
        ))}
      </ul>
    </main>
  )
}

function formatDateTime(iso) {
  const dt = new Date(iso)
  return `${dt.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })} ${dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
}

function tripZoneLabel(trip) {
  if (!trip) return ''
  if (trip.zoneLabel) return trip.zoneLabel
  if (trip.originZoneLabel || trip.destinationZoneLabel) {
    const parts = [trip.originZoneLabel, trip.destinationZoneLabel].filter(Boolean)
    return parts.length ? parts.join(' → ') : ''
  }
  return trip.zone || ''
}

function GroupMini({ groupId }){
  const [g, setG] = useState(null)
  const [showContacts, setShowContacts] = useState(false)
  const [showRoute, setShowRoute] = useState(false)

  useEffect(()=> {
    api.get(`/match/group/${groupId}`).then(({data}) => setG(data)).catch(()=>{})
  }, [groupId])

  if (!g) return null
  const slots = g.capacity
  const members = g.members || []
  const empty = Math.max(0, slots - members.length)
  const stops = g.route?.stops || []

  return (
    <div className="mt-2 rounded border p-2 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">Grupo de viaje</p>
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-1 text-xs px-2 py-1 rounded border"
            onClick={() => setShowRoute((v) => !v)}
          >
            {showRoute ? '▲' : '▼'} Ruta
          </button>
          <button
            className="text-xs underline"
            onClick={()=> setShowContacts(v=>!v)}
          >
            {showContacts ? 'Ocultar contactos' : 'Ver contactos'}
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {members.map(m => (
          <span key={m.id} className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-neutral-900 text-white text-xs">
            {m.initials}
          </span>
        ))}
        {Array.from({length: empty}).map((_,i)=>(
          <span key={i} className="inline-flex items-center justify-center w-8 h-8 rounded-full border text-neutral-500">+</span>
        ))}
      </div>

      {showRoute && stops.length >= 2 && (
        <div className="space-y-2">
          <RouteMap stops={stops} height={240} />
          <ol className="text-xs text-gray-600 space-y-1">
            {stops.map((stop, idx) => (
              <li key={`${stop.type}-${idx}`}>
                {stop.type === 'dropoff' ? '🎯' : `Parada ${idx + 1}`}: {stop.label}
                {stop.address ? ` · ${stop.address}` : ''}
              </li>
            ))}
          </ol>
        </div>
      )}

      {showRoute && stops.length < 2 && (
        <p className="text-xs text-gray-500">No hay suficientes ubicaciones para graficar la ruta.</p>
      )}

      {showContacts && (
        <div className="rounded border p-2 bg-neutral-50 text-sm">
          <ul className="space-y-1">
            {members.map(m => (
              <li key={m.id}>
                <span className="font-medium">{m.name}</span>
                {m.origin?.address ? ` · ${m.origin.address}` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
