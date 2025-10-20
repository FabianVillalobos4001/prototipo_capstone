import { useEffect, useRef, useState } from 'react'
import { useGoogleMaps } from '../lib/useGoogleMaps'

/**
 * Devuelve { address, lat, lng, placeId }
 * - country: restringe sugerencias, p.ej. 'cl'
 * - types: ['geocode'] | ['establishment'] | ['address'] | ['(cities)']...
 */
export default function GoogleAddressAutocomplete({
  label,
  value,
  onChange,
  placeholder = 'Escribe una dirección…',
  country = 'cl',
  types = ['geocode'],
}) {
  const { loaded, error } = useGoogleMaps()
  const inputRef = useRef(null)
  const autoRef = useRef(null)
  const sessionRef = useRef(null) // para optimizar facturación por sesión
  const [text, setText] = useState(value?.address || '')

  // mantén sincronizado si el value externo cambia
  useEffect(() => {
    if (value?.address && value.address !== text) setText(value.address)
  }, [value?.address])

  useEffect(() => {
    if (!loaded || error || !inputRef.current || autoRef.current) return

    const gm = window.google.maps
    // token de sesión por UX (varias consultas = 1 sesión)
    sessionRef.current = new gm.places.AutocompleteSessionToken()

    autoRef.current = new gm.places.Autocomplete(inputRef.current, {
      fields: ['place_id','formatted_address','geometry'],
      types, // p.ej. ['geocode'] o ['establishment']
      componentRestrictions: country ? { country } : undefined,
    })

    autoRef.current.addListener('place_changed', () => {
      const place = autoRef.current.getPlace()
      if (!place || !place.geometry) return
      const address = place.formatted_address || inputRef.current.value
      const lat = place.geometry.location.lat()
      const lng = place.geometry.location.lng()
      const placeId = place.place_id
      setText(address)
      onChange?.({ address, lat, lng, placeId })
    })
  }, [loaded, error])

  return (
    <div className="relative">
      {label && <label className="text-sm font-medium block mb-1">{label}</label>}
      <input
        ref={inputRef}
        className="w-full border rounded p-2"
        placeholder={placeholder}
        value={text}
        onChange={(e)=> setText(e.target.value)}
        onBlur={() => {
          // si solo escribieron y no eligieron sugerencia,
          // no dispares onChange; esperas a la selección
        }}
      />
    </div>
  )
}
