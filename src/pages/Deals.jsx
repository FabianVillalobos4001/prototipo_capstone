// src/pages/Deals.jsx
import { useState } from 'react'
import GoogleAddressAutocomplete from '../components/GoogleAddressAutocomplete'
import MapPickerModal from '../components/MapPickerModal'
import api from '../api/axios'

export default function Deals() {
  const [origin, setOrigin] = useState(null)       // {address, lat, lng, placeId}
  const [destination, setDestination] = useState(null)
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState('origin')       // 'origin' | 'destination'
  const [loading, setLoading] = useState(false)
  const [loadingTx, setLoadingTx] = useState(false)
  const [err, setErr] = useState('')
  const [options, setOptions] = useState([])

  const openMapFor = (m) => { setMode(m); setOpen(true) }

  // --- BOTÓN "Buscar opciones" (tus opciones genéricas) ---
  const search = async () => {
    setErr(''); setOptions([]); setLoading(true)
    try {
      const { lat:oLat, lng:oLng } = origin || {}
      const { lat:dLat, lng:dLng } = destination || {}
      if (!oLat || !oLng || !dLat || !dLng) {
        setErr('Selecciona origen y destino'); return
      }
      const { data } = await api.get('/quick/options', { params: { oLat, oLng, dLat, dLng } })
      setOptions((data?.options || []).sort((a,b)=>(a.price ?? 1e12)-(b.price ?? 1e12)))
    } catch (e) {
      setErr(e?.response?.data?.error || 'No se pudieron obtener opciones')
    } finally { setLoading(false) }
  }

  // --- BOTÓN "Transvip (Aeropuerto)" ---
  const buscarTransvip = async () => {
    setErr('')
    if (!origin || !destination) {
      setErr('Selecciona origen y destino'); return
    }
    // opcional: advertir si el destino no parece aeropuerto
    if (!looksLikeAirport(destination?.address)) {
      // no bloquea, solo avisa
      setErr('Aviso: el destino no parece aeropuerto; Transvip (Aeropuerto) puede no aplicar')
    }

    setLoadingTx(true)
    try {
      const params = {
        oLat: origin.lat,
        oLng: origin.lng,
        pickup_date: todayYYYYMMDD(),
        pickup_hour: oneHourLaterRounded5(), // 1h después, redondeado a /5
        pax: 1,
        round_trip: 'N',
        convenio: 379,                       // según tu captura
      }

      const { data } = await api.get('/transvip/air', { params })

      if (data?.ok) {
        // Normaliza para tu UI (usa opt.price y opt.etaMin)
        const mapped = (data.options || []).map(o => ({
          id: o.id,
          name: `Transvip · ${o.name}`,
          price: o.price,                        // número
          priceText: o.price_formatted,          // "CLP $9.600"
          etaMin: o.etaSec ? Math.round(o.etaSec / 60) : null,
          link: o.link || 'https://www.transvip.cl/'
        }))
        setOptions(prev =>
          [...mapped, ...prev].sort((a,b)=>(a.price ?? 1e12)-(b.price ?? 1e12))
        )
      } else {
        setErr('Transvip no devolvió precios')
      }
    } catch (e) {
      setErr('Error consultando Transvip')
    } finally {
      setLoadingTx(false)
    }
  }

  return (
    <main className="p-4 max-w-md mx-auto grid gap-4">
      <h1 className="text-xl font-bold">Viaje rápido</h1>
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
          <button
            type="button"
            onClick={() => openMapFor('origin')}
            className="h-10 px-3 rounded bg-neutral-900 text-white text-sm"
          >
            🗺️ Mapa
          </button>
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
              types={['establishment']} // mejor para “Aeropuerto…”, “Planta…”
              country="cl"
              placeholder="Ej: Aeropuerto de Santiago"
              bounds={{ south:-33.7, west:-70.9, north:-33.2, east:-70.4 }} // prioriza Stgo
            />
          </div>
          <button
            type="button"
            onClick={() => openMapFor('destination')}
            className="h-10 px-3 rounded bg-neutral-900 text-white text-sm"
          >
            🗺️ Mapa
          </button>
        </div>
        {destination?.address && <p className="text-xs text-gray-500">Seleccionado: {destination.address}</p>}
      </div>

      {/* Acciones */}
      <button onClick={search} disabled={loading || loadingTx}
        className="rounded bg-black text-white py-2">
        {loading ? 'Buscando…' : 'Buscar opciones'}
      </button>

      <button onClick={buscarTransvip} disabled={loading || loadingTx}
        className="rounded bg-neutral-800 text-white py-2">
        {loadingTx ? 'Consultando Transvip…' : 'Transvip (Aeropuerto)'}
      </button>

      {/* Resultados */}
      <ul className="grid gap-3">
        {options.map(opt => (
          <li key={opt.id} className="border rounded p-3 flex items-center justify-between">
            <div>
              <p className="font-medium">{opt.name}</p>
              <p className="text-sm text-gray-600">
                {opt.etaMin ? `ETA ${opt.etaMin} min · ` : ''}
                {opt.priceText ? opt.priceText : (opt.price != null ? `CLP $${opt.price.toLocaleString('es-CL')}` : '—')}
              </p>
            </div>
            <a className="rounded bg-neutral-900 text-white px-3 py-2 text-sm"
               href={opt.link} target="_blank" rel="noreferrer">
              Abrir
            </a>
          </li>
        ))}
      </ul>

      {/* Modal de mapa (para afinar pin) */}
      <MapPickerModal
        open={open}
        onClose={() => setOpen(false)}
        initialValue={mode === 'origin' ? origin : destination}
        title={mode === 'origin' ? 'Elegir punto de partida' : 'Elegir destino'}
        onConfirm={(pt) => { mode === 'origin' ? setOrigin(pt) : setDestination(pt) }}
      />
    </main>
  )
}

/* ===== Helpers ===== */
function looksLikeAirport(addr='') {
  const a = addr.toLowerCase()
  return a.includes('aeropuerto') || a.includes('arturo merino') || a.includes('scl')
}

function todayYYYYMMDD() {
  const d = new Date()
  const mm = String(d.getMonth()+1).padStart(2,'0')
  const dd = String(d.getDate()).padStart(2,'0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

// 1 hora después, redondeado hacia arriba a múltiplos de 5 minutos => "HH:MM"
function oneHourLaterRounded5() {
  const d = new Date()
  d.setMinutes(d.getMinutes() + 60)
  const m = d.getMinutes()
  const rounded = Math.ceil(m / 5) * 5
  if (rounded === 60) {
    d.setHours(d.getHours() + 1)
    d.setMinutes(0)
  } else {
    d.setMinutes(rounded)
  }
  const hh = String(d.getHours()).padStart(2,'0')
  const mm = String(d.getMinutes()).padStart(2,'0')
  return `${hh}:${mm}`
}
