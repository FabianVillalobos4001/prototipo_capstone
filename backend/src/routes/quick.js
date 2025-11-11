import { Router } from 'express'
import QuickSelection from '../models/QuickSelection.js'
import { requireAuth } from '../middleware/requireAuth.js'

const r = Router()

// Tarifas “mock” editables (CLP)
const PRICING = {
  transit_flat: 900,                 // aprox integrado RED (ajústalo según tramo)
  uberx:   { base: 500,  perKm: 700, perMin: 120, minFare: 2000 },
  comfort: { base: 700,  perKm: 900, perMin: 150, minFare: 2800 },
}

r.get('/options', async (req, res) => {
  try {
    const { oLat, oLng, dLat, dLng } = req.query
    if (!oLat || !oLng || !dLat || !dLng) {
      return res.status(400).json({ error: 'Faltan coordenadas' })
    }

    const origin = `${oLat},${oLng}`
    const dest   = `${dLat},${dLng}`

    // 1) Driving (para distancia/min estimados)
    const driving = await gDirections({
      origin, destination: dest, mode: 'driving'
    })

    const driveLeg = driving?.routes?.[0]?.legs?.[0]
    const km  = (driveLeg?.distance?.value ?? 0) / 1000
    const min = Math.round((driveLeg?.duration?.value ?? 0) / 60)

    // 2) Transit (RED/Metro/bus): ETA real
    const transit = await gDirections({
      origin, destination: dest, mode: 'transit', transit_mode: 'rail|bus'
    })
    const tLeg = transit?.routes?.[0]?.legs?.[0]
    const tMin = tLeg ? Math.round((tLeg.duration.value)/60) : null

    // 3) Construimos opciones
    const options = []

    if (tMin !== null) {
      options.push({
        id: 'transit',
        name: 'RED (Metro/Bus)',
        etaMin: tMin,
        price: PRICING.transit_flat,
        currency: 'CLP',
        link: gmapsLink(origin, dest, 'transit'),
        provider: 'red',
      })
    }

    // Ride-hailing estimado (fórmula simple)
    const est = (cfg) => Math.max(
      cfg.minFare,
      Math.round(cfg.base + cfg.perKm * km + cfg.perMin * min)
    )

    options.push({
      id: 'uberx',
      name: 'UberX (estimado)',
      etaMin: min,
      price: est(PRICING.uberx),
      currency: 'CLP',
      link: uberDeeplink(oLat, oLng, dLat, dLng),   // abre Uber con pickup/dropoff
      provider: 'uber',
    })

    options.push({
      id: 'comfort',
      name: 'Confort (estimado)',
      etaMin: min,
      price: est(PRICING.comfort),
      currency: 'CLP',
      // hasta tener deep link de cabify/didi, redirige a mapas
      link: gmapsLink(origin, dest, 'driving'),
      provider: 'generic',
    })

    // Ordenamos por precio
    options.sort((a,b)=> a.price - b.price)
    res.json({ options, km, min })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'No se pudieron calcular opciones' })
  }
})

r.post('/selections', requireAuth, async (req, res) => {
  try {
    const { origin, destination, options = [], selectedOption } = req.body || {}
    if (!origin || !destination || !selectedOption) {
      return res.status(400).json({ error: 'Faltan datos para registrar la selección' })
    }

    const normalizedOrigin = normalizePoint(origin)
    const normalizedDestination = normalizePoint(destination)
    const normalizedOptions = Array.isArray(options)
      ? options.slice(0, 50).map(normalizeOptionForStorage)
      : []
    const normalizedSelected = normalizeOptionForStorage(selectedOption)

    if (!normalizedOrigin || !normalizedDestination) {
      return res.status(400).json({ error: 'Coordenadas inválidas' })
    }

    const comparison = normalizedOptions.reduce((acc, opt) => {
      if (opt.id === normalizedSelected.id) return acc
      if (typeof opt.price !== 'number') return acc
      if (acc === null || opt.price < acc.price) return { price: opt.price, optionId: opt.id }
      return acc
    }, null)

    const savedAmount = comparison && typeof normalizedSelected.price === 'number'
      ? Number((comparison.price - normalizedSelected.price).toFixed(2))
      : undefined

    const created = await QuickSelection.create({
      user: req.auth?.id,
      userEmail: req.auth?.email,
      origin: normalizedOrigin,
      destination: normalizedDestination,
      options: normalizedOptions,
      selectedOption: normalizedSelected,
      selectedOptionId: normalizedSelected.id,
      selectedPrice: normalizedSelected.price,
      selectedCurrency: normalizedSelected.currency,
      cheapestAlternativePrice: comparison?.price,
      cheapestAlternativeOptionId: comparison?.optionId,
      savedAmountVsCheapest: savedAmount,
    })

    res.status(201).json({ ok: true, id: created._id })
  } catch (err) {
    console.error('POST /quick/selections error', err)
    res.status(500).json({ error: 'No se pudo guardar la selección' })
  }
})

export default r

/* ----------------- helpers ----------------- */
function gmapsLink(origin, destination, mode='transit') {
  const p = new URLSearchParams({
    api: '1',
    origin,
    destination,
    travelmode: mode
  })
  return `https://www.google.com/maps/dir/?${p.toString()}`
}

function uberDeeplink(oLat,oLng,dLat,dLng) {
  const p = new URLSearchParams({
    'action': 'setPickup',
    'pickup[latitude]':  oLat,
    'pickup[longitude]': oLng,
    'dropoff[latitude]': dLat,
    'dropoff[longitude]': dLng,
  })
  return `https://m.uber.com/ul/?${p.toString()}`
}

async function gDirections({ origin, destination, mode='driving', transit_mode }) {
  const key = process.env.GOOGLE_MAPS_API_KEY
  const params = new URLSearchParams({
    origin, destination, mode, key, language: 'es', region: 'CL'
  })
  if (transit_mode) params.set('transit_mode', transit_mode)
  const url = `https://maps.googleapis.com/maps/api/directions/json?${params.toString()}`
  const res = await fetch(url)
  return res.json()
}

function normalizePoint(pt = {}) {
  const lat = Number(pt.lat ?? pt.latitude)
  const lng = Number(pt.lng ?? pt.longitude)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return {
    address: typeof pt.address === 'string' ? pt.address : undefined,
    lat,
    lng,
  }
}

function normalizeOptionForStorage(opt = {}) {
  return {
    id: opt.id || opt.provider || undefined,
    name: opt.name,
    provider: opt.provider,
    price: typeof opt.price === 'number' ? opt.price : undefined,
    priceText: opt.priceText,
    currency: opt.currency,
    etaMin: typeof opt.etaMin === 'number' ? opt.etaMin : undefined,
    link: opt.link,
  }
}
