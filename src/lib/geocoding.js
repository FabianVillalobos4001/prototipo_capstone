// src/lib/geocoding.js
const BASE = 'https://nominatim.openstreetmap.org'



export function shortAddress(display_name, address = {}) {
  // si Nominatim entrega address ya separado
  const parts = [
    address.road || '',           // calle
    address.house_number || '',   // número
    address.suburb || '',         // barrio / villa
    address.town || address.city || address.village || '', // comuna / ciudad
    address.country || '',        // país
  ].filter(Boolean)

  return parts.join(', ')
}

export async function searchPlaces(query, opts = {}) {
  if (!query?.trim()) return []
  const url = new URL(`${BASE}/search`)
  url.search = new URLSearchParams({
    q: query,
    format: 'jsonv2',
    addressdetails: '1',
    limit: String(opts.limit || 5),
    countrycodes: opts.countrycodes || 'cl',
    'accept-language': opts.lang || 'es',
  }).toString()

  const res = await fetch(url)
  if (!res.ok) return []
  const data = await res.json()

  return data.map(item => ({
    address: shortAddress(item.display_name, item.address),
    fullAddress: item.display_name, // por si quieres guardarla completa también
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
  }))
}

export async function reverseGeocode(lat, lng, opts = {}) {
  const url = new URL(`${BASE}/reverse`)
  url.search = new URLSearchParams({
    format: 'jsonv2',
    lat: String(lat),
    lon: String(lng),
    'accept-language': opts.lang || 'es',
  }).toString()

  const res = await fetch(url)
  if (!res.ok) return { address: '' }
  const data = await res.json()
  return {
    address: shortAddress(data.display_name, data.address),
    fullAddress: data.display_name,
  }
}
