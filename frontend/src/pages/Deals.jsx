// src/pages/Deals.jsx
import { useEffect, useRef, useState } from 'react'
import GoogleAddressAutocomplete from '../components/GoogleAddressAutocomplete'
import MapPickerModal from '../components/MapPickerModal'
import api from '../api/axios'

const CACHE_KEY = 'quickComparisonCache'
const CACHE_TTL_MS = 30 * 60 * 1000 // 30 minutos
const MAX_CACHE_OPTIONS = 20

export default function Deals() {
  const [origin, setOrigin] = useState(null)       // {address, lat, lng, placeId}
  const [destination, setDestination] = useState(null)
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState('origin')       // 'origin' | 'destination'
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [notice, setNotice] = useState('')
  const [options, setOptions] = useState([])
  const cacheReadyRef = useRef(false)
  const skipResetRef = useRef(false)

  const openMapFor = (m) => { setMode(m); setOpen(true) }

  // Rehidrata el ultimo estado si sigue fresco
  useEffect(() => {
    if (typeof window === 'undefined') {
      cacheReadyRef.current = true
      return
    }
    const cached = readQuickCache()
    if (cached) {
      skipResetRef.current = true
      if (cached.origin) setOrigin(cached.origin)
      if (cached.destination) setDestination(cached.destination)
      if (Array.isArray(cached.options) && cached.options.length) {
        setOptions(cached.options)
      }
    }
    cacheReadyRef.current = true
  }, [])

  // Si el usuario cambia origen/destino, limpia resultados
  useEffect(() => {
    if (!cacheReadyRef.current) return
    if (skipResetRef.current) {
      skipResetRef.current = false
      return
    }
    setOptions([])
    setErr('')
    setNotice('')
  }, [origin, destination])

  // Persiste entradas para que no se pierdan al navegar
  useEffect(() => {
    if (!cacheReadyRef.current) return
    persistQuickCache({ origin, destination, options })
  }, [origin, destination, options])

  // --- Boton "Buscar opciones" (consulta generales + Transvip) ---
  const search = async () => {
    setErr('')
    setNotice('')
    setOptions([])
    try {
      const { lat:oLat, lng:oLng } = origin || {}
      const { lat:dLat, lng:dLng } = destination || {}
      if (!oLat || !oLng || !dLat || !dLng) {
        setErr('Selecciona origen y destino'); return
      }
      const airportLike = looksLikeAirport(destination?.address)
      if (!airportLike) {
        setNotice('Aviso: el destino no parece aeropuerto; tarifas de Transvip pueden no estar disponibles.')
      }

      setLoading(true)

      const quickPromise = api.get('/quick/options', { params: { oLat, oLng, dLat, dLng } })
      const transvipPromise = api.get('/transvip/air', {
        params: {
          oLat: origin.lat,
          oLng: origin.lng,
          pickup_date: todayYYYYMMDD(),
          pickup_hour: oneHourLaterRounded5(),
          pax: 1,
          round_trip: 'N',
          convenio: 379,
        },
      }).catch(() => null)

      const [quickRes, transvipRes] = await Promise.allSettled([quickPromise, transvipPromise])

      const combined = []

      if (quickRes.status === 'fulfilled') {
        const raw = quickRes.value?.data?.options || []
        combined.push(...raw.map(normalizeOption))
      } else {
        const msg = quickRes.reason?.response?.data?.error || quickRes.reason?.message || 'No se pudieron obtener opciones'
        setErr((prev) => prev || msg)
      }

      if (transvipRes && transvipRes.status === 'fulfilled') {
        if (transvipRes.value === null) {
          setNotice((prev) => prev || 'No fue posible consultar Transvip en este momento')
        } else {
          const data = transvipRes.value?.data
          if (data?.ok) {
            const mapped = (data.options || []).map((o) => ({
              id: `transvip-${o.id || o.name}`,
              name: `Transvip - ${o.name}`,
              price: o.price,
              priceText: o.price_formatted,
              etaMin: o.etaSec ? Math.round(o.etaSec / 60) : null,
              link: o.link || 'https://www.transvip.cl/',
              provider: 'transvip',
              currency: 'CLP',
            }))
            combined.push(...mapped)
          } else if (!airportLike) {
            setNotice((prev) => prev || 'Transvip no devolvio precios para este destino')
          } else {
            setErr((prev) => prev || 'Transvip no devolvio precios')
          }
        }
      } else if (transvipRes?.status === 'rejected') {
        setNotice((prev) => prev || 'No fue posible consultar Transvip en este momento')
      }

      combined.sort((a, b) => (a.price ?? Number.POSITIVE_INFINITY) - (b.price ?? Number.POSITIVE_INFINITY))
      setOptions(combined)
      persistQuickCache({ origin, destination, options: combined })
    } catch (e) {
      setErr((prev) => prev || e?.response?.data?.error || 'No se pudieron obtener opciones')
    } finally {
      setLoading(false)
    }
  }

  const handleOptionOpen = (option) => {
    if (!option?.link) return
    if (!origin || !destination) return
    api.post('/quick/selections', {
      origin,
      destination,
      options: options.slice(0, 50),
      selectedOption: option,
    }).catch((error) => {
      console.warn('No se pudo registrar la seleccion de tarifa', error?.response?.data?.error || error?.message)
    })
  }

  return (
    <main className="p-4 max-w-md mx-auto grid gap-4">
      <h1 className="text-xl font-bold">Comparar tarifas</h1>
      {err && <p className="text-red-600 text-sm">{err}</p>}
      {notice && <p className="text-amber-600 text-sm">{notice}</p>}

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
            Abrir mapa
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
              types={['establishment']} // mejor para aeropuertos o lugares especificos
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
            Abrir mapa
          </button>
        </div>
        {destination?.address && <p className="text-xs text-gray-500">Seleccionado: {destination.address}</p>}
      </div>

      {/* Acciones */}
      <button onClick={search} disabled={loading}
        className="rounded bg-black text-white py-2">
        {loading ? 'Buscando...' : 'Buscar opciones'}
      </button>

      {/* Resultados */}
      <ul className="grid gap-3">
        {options.map(opt => (
          <li key={opt.id} className="border rounded p-3 flex items-center justify-between">
            <div>
              <p className="font-medium">{opt.name}</p>
              <p className="text-sm text-gray-600">
                {opt.etaMin ? `ETA ${opt.etaMin} min - ` : ''}
                {opt.priceText ? opt.priceText : (opt.price != null ? `CLP $${opt.price.toLocaleString('es-CL')}` : '--')}
              </p>
            </div>
            <a
              className="rounded bg-neutral-900 text-white px-3 py-2 text-sm"
              href={opt.link}
              target="_blank"
              rel="noreferrer noopener"
              onClick={() => handleOptionOpen(opt)}
            >
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
function normalizeOption(opt = {}) {
  const rawPrice = opt.price ?? null
  const price = typeof rawPrice === 'number' ? rawPrice : (rawPrice != null ? Number(rawPrice) : null)
  const currency = opt.currency || 'CLP'
  const name = opt.name || opt.provider || 'Opcion'
  const provider = opt.provider || name
  const fallbackId = opt.id || `${opt.provider || 'op'}-${name}`.toLowerCase().replace(/\s+/g, '-')

  return {
    id: fallbackId,
    name,
    provider,
    price,
    priceText: opt.priceText || (price != null ? `${currency} $${price.toLocaleString('es-CL')}` : undefined),
    etaMin: opt.etaMin ?? null,
    link: opt.link || '#',
    currency,
  }
}

function looksLikeAirport(addr = '') {
  const a = addr.toLowerCase();

  return (
    // Aeropuerto Internacional Arturo Merino Benítez (Santiago)
    a.includes('aeropuerto arturo merino') ||
    a.includes('arturo merino benítez') ||
    a.includes('armando cortínez') || // ← detecta la calle del aeropuerto
    a.includes('pudahuel') && a.includes('1704') ||
    a.includes('scl') ||
    a.includes('aeropuerto santiago') ||

    // Región de Valparaíso / Viña del Mar
    a.includes('aeropuerto torquemada') ||
    a.includes('aeródromo torquemada') ||
    a.includes('aeródromo viña') ||
    a.includes('aeródromo reñaca alto') ||
    a.includes('aeródromo quintero') ||
    a.includes('aeródromo santo domingo') ||
    a.includes('aeródromo san antonio') ||

    // Palabras genéricas
    a.includes('aeropuerto') ||
    a.includes('aerodromo') ||
    a.includes('aeródromo') ||
    a.includes('terminal aéreo') ||
    a.includes('aviación')
  );
}


function todayYYYYMMDD() {
  const d = new Date()
  const mm = String(d.getMonth()+1).padStart(2,'0')
  const dd = String(d.getDate()).padStart(2,'0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

// 1 hora despues, redondeado hacia arriba a multiplos de 5 minutos => "HH:MM"
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

function readQuickCache() {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(CACHE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (!parsed?.timestamp) return null
    if (Date.now() - parsed.timestamp > CACHE_TTL_MS) {
      window.localStorage.removeItem(CACHE_KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function persistQuickCache({ origin, destination, options }) {
  if (typeof window === 'undefined') return
  try {
    const payload = {
      timestamp: Date.now(),
      origin: origin || null,
      destination: destination || null,
      options: Array.isArray(options) ? options.slice(0, MAX_CACHE_OPTIONS) : [],
    }
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(payload))
  } catch (err) {
    console.warn('No se pudo guardar el cache del comparador', err)
  }
}
