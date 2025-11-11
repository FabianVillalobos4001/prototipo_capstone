// src/pages/Home.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import RouteMap from '../components/RouteMap'
import { useAuth } from '../features/auth/AuthContext'

export default function Home(){
  const { user } = useAuth()
  const [myTrips, setMyTrips] = useState([])
  const [sugs, setSugs]     = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const contactEnabled = Boolean(user?.carpoolContactEnabled)
  const contactMethod = user?.carpoolContactMethod || 'phone'
  const contactValue = contactMethod === 'chat' ? user?.carpoolChatHandle : user?.phone
  const contactNote = user?.carpoolContactNote

  // 1) Cargar mis viajes
  useEffect(() => {
    setLoading(true)
    api.get('/trips/mine')
      .then(({data}) => setMyTrips(data || []))
      .catch(() => setErr('No fue posible cargar tus viajes'))
      .finally(() => setLoading(false))
  }, [])

  // 2) Detectar mi proximo viaje y pedir sugerencias
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

      <section className="rounded-lg border p-4 bg-white shadow-sm text-sm w-full">
        {contactEnabled && contactValue ? (
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-gray-600">Compartiras este contacto cuando te unas a un viaje compartido:</p>
              <p className="text-base font-semibold text-black">
                {contactMethod === 'chat' ? `Chat: ${contactValue}` : `Telefono: ${contactValue}`}
              </p>
              {contactNote && <p className="text-xs text-gray-500 mt-1">{contactNote}</p>}
            </div>
            <Link to="/profile" className="text-emerald-700 font-medium text-xs underline mt-2 sm:mt-0">
              Editar en mi perfil
            </Link>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p className="text-gray-600">
              Comparte un telefono o chat para que tus companeros puedan coordinar el viaje contigo.
            </p>
            <Link to="/profile" className="text-xs font-semibold text-emerald-700 underline">
              Configurar contacto
            </Link>
          </div>
        )}
      </section>

      {err && <p className="text-red-600 text-sm">{err}</p>}

      {/* Sugerencias de matching para el proximo viaje */}
      {upcoming ? (
        <>
         <p className="text-sm text-gray-600">
           Proximo viaje: {formatDateTime(upcoming.arrivalTime)}
           {' - '}Destino: {upcoming.destination?.address}
            {tripZoneLabel(upcoming) ? ` - Ruta: ${tripZoneLabel(upcoming)}` : ''}
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
                        {s.user.name} - llega {formatDateTime(s.arrivalTime)}
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
        <p className="text-sm text-gray-500">No tienes viajes proximos. Planifica uno para ver coincidencias.</p>
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
           <p className="font-medium">{t.origin?.address || 'Origen'} - {t.destination?.address || 'Destino'}</p>
            <p className="text-sm text-gray-600">
              Llega: {formatDateTime(t.arrivalTime)}
              {tripZoneLabel(t) ? ` - Ruta: ${tripZoneLabel(t)}` : ''}
              {' - '}Estado: {t.status}
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
    return parts.length ? parts.join(' - ') : ''
  }
  return trip.zone || ''
}

function GroupMini({ groupId }) {
  const [g, setG] = useState(null)
  const [showContacts, setShowContacts] = useState(false)
  const [showRoute, setShowRoute] = useState(false)

  useEffect(() => {
    api.get(`/match/group/${groupId}`).then(({ data }) => setG(data)).catch(() => {})
  }, [groupId])

  if (!g) return null
  const slots = g.capacity
  const members = g.members || []
  const empty = Math.max(0, slots - members.length)
  const stops = g.route?.stops || []

  return (
    <div className="mt-2 rounded border p-2 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-sm font-medium">Grupo de viaje</p>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Link
            to={`/chat/${groupId}`}
            className="text-xs px-3 py-1 rounded border bg-black text-white"
          >
            Chat
          </Link>
          <button
            className="flex items-center gap-1 text-xs px-2 py-1 rounded border"
            onClick={() => setShowRoute((v) => !v)}
          >
            {showRoute ? 'Ocultar ruta' : 'Ver ruta'}
          </button>
          <button
            className="text-xs underline"
            onClick={() => setShowContacts((v) => !v)}
          >
            {showContacts ? 'Ocultar contactos' : 'Ver contactos'}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {members.map((m) => (
          <span key={m.id} className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-neutral-900 text-white text-xs">
            {m.initials}
          </span>
        ))}
        {Array.from({ length: empty }).map((_, i) => (
          <span key={i} className="inline-flex items-center justify-center w-8 h-8 rounded-full border text-neutral-500">+</span>
        ))}
      </div>

      {showRoute && stops.length >= 2 && (
        <div className="space-y-2">
          <RouteMap stops={stops} height={240} />
          <ol className="text-xs text-gray-600 space-y-1">
            {stops.map((stop, idx) => (
              <li key={`${stop.type}-${idx}`}>
                {stop.type === 'dropoff' ? 'Destino' : `Parada ${idx + 1}`}: {stop.label}
                {stop.address ? ` - ${stop.address}` : ''}
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
          <ul className="space-y-2">
            {members.map((m) => (
              <li key={m.id}>
                <p>
                  <span className="font-medium">{m.name}</span>
                  {m.origin?.address ? ` - ${m.origin.address}` : ''}
                </p>
                {m.contact ? (
                  <p className="text-xs text-gray-600">
                    {m.contact.method === 'chat' ? `Chat: ${m.contact.value}` : `Telefono: ${m.contact.value}`}
                    {m.contact.note ? ` - ${m.contact.note}` : ''}
                  </p>
                ) : (
                  <p className="text-xs text-gray-400">No compartio contacto</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

