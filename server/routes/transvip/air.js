import { Router } from 'express'
import axios from 'axios'
import { CookieJar } from 'tough-cookie'
import { wrapper } from 'axios-cookiejar-support'

const r = Router()

// Transforma "YYYY-MM-DD" + "HH:mm" a lo que espera el sitio (string simple)
function ensureStr(v) { return (v ?? '').toString().trim() }

// Convierte lat/lng a "lat,lng" (string)
function latlng(lat, lng) {
  return `${Number(lat).toFixed(6)},${Number(lng).toFixed(6)}`
}

/**
 * GET /api/transvip/air
 * Params obligatorios:
 *  - oLat, oLng   (origen del usuario)
 *  - pickup_date  (YYYY-MM-DD)
 *  - pickup_hour  (HH:mm)
 *  - pax          (1..7)
 * Opcionales:
 *  - convenio (por tu captura es 379; si no, manda null)
 *  - round_trip = 'N' | 'S'
 * 
 * Nota: Este endpoint es para "hacia AEROPUERTO SCL" (airport=scl).
 * Para el trayecto inverso existe normalmente otro endpoint (ej. *home*).
 */
r.get('/air', async (req, res) => {
  try {
    const {
      oLat, oLng,
      pickup_date, pickup_hour,
      pax = '1',
      convenio = '379',
      round_trip = 'N',
    } = req.query

    if (!oLat || !oLng || !pickup_date || !pickup_hour) {
      return res.status(400).json({ error: 'Faltan oLat, oLng, pickup_date, pickup_hour' })
    }

    // cliente con cookie-jar para mantener sesión PHP
    const jar = new CookieJar()
    const client = wrapper(axios.create({
      baseURL: 'https://reservas.transvip.cl',
      jar,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Metso-Transport Demo)',
        'Accept': 'application/json, text/plain, */*',
        'Origin': 'https://www.transvip.cl',
        'Referer': 'https://www.transvip.cl/',
      },
      timeout: 15000,
      validateStatus: s => s >= 200 && s < 500,
    }))

    // (Opcional) semilla de cookies
    await client.get('/')

    // El endpoint espera "Form Data" (x-www-form-urlencoded)
    const form = new URLSearchParams()
    form.set('convenio', ensureStr(convenio))               // en tu captura: 379
    form.set('airport', 'scl')                               // código SCL fijo
    form.set('address_georeference', latlng(oLat, oLng))     // "-33.41269,-70.54271"
    form.set('type_of_trip', 'R')                            // R: hacia aeropuerto (por tu captura)
    form.set('pickup_date', ensureStr(pickup_date))          // "2025-10-20"
    form.set('pickup_hour', ensureStr(pickup_hour))          // "00:45"
    // Estos los manda Transvip en tu respuesta; no son obligatorios si no haces round-trip
    // pero los ponemos vacíos para evitar warnings:
    form.set('dropoff_date', '')                             // si fuera ida/vuelta, ajusta
    form.set('dropoff_hour', '')
    form.set('round_trip', ensureStr(round_trip))            // 'N' o 'S'
    form.set('pax', ensureStr(pax))                          // "1"

    const resp = await client.post(
      '/public/calls/get_services_air.php',
      form.toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    )

    if (resp.status !== 200 || !resp.data) {
      return res.status(502).json({ error: 'Transvip no respondió OK', raw: resp.data })
    }

    // Normaliza a una lista de opciones simplificada
    const data = resp.data
    const options = (data.service || []).filter(s => s.mostrar).map(s => ({
      id: `transvip_${s.service_id}`,
      provider: 'transvip',
      name: s.service_name,               // "Compartido", "Auto", "Van"
      price: s.price,                     // 9600
      price_formatted: `CLP $${s.price_formated}`, // "CLP $9.600"
      max_pax: s.max_limit,
      image: s.service_image,
      etaSec: (s.service_name === 'Compartido') ? data.shared_eta : data.private_eta,
      link: 'https://www.transvip.cl/',   // abre flujo oficial
      meta: {
        airport_code: data.airport_code,
        pickup_range: {
          lower: data.pickup_lower_range_shared || data.pickup_lower_range_private,
          upper: data.pickup_top_range_shared   || data.pickup_top_range_private,
        }
      }
    })).sort((a,b)=> (a.price ?? 1e12) - (b.price ?? 1e12))

    return res.json({ ok: true, options, raw: data })
  } catch (e) {
    console.error('transvip/air error', e.message)
    return res.status(500).json({ error: 'Error consultando Transvip' })
  }
})

export default r
