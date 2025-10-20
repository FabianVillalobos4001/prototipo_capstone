// src/components/AddressAutocomplete.jsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { searchPlaces } from '../lib/geocoding'

export default function AddressAutocomplete({ label, value, onChange, placeholder = 'Escribe una dirección…' }) {
  const [q, setQ] = useState(value?.address || '')
  const [items, setItems] = useState([])
  const [open, setOpen] = useState(false)
  const boxRef = useRef(null)

  // Debounce simple
  const debouncedQ = useDebounce(q, 250)

  useEffect(() => {
    let active = true
    ;(async () => {
      if (!debouncedQ.trim()) { setItems([]); return }
      const results = await searchPlaces(debouncedQ)
      if (active) setItems(results)
    })()
    return () => { active = false }
  }, [debouncedQ])

  useEffect(() => {
    function handleClickOutside(e) {
      if (!boxRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  useEffect(() => {
    // Si el value externo cambia, sincroniza el texto
    if (value?.address && value.address !== q) setQ(value.address)
  }, [value?.address])

  const selectItem = (it) => {
    onChange?.(it) // {address,lat,lng}
    setQ(it.address)
    setOpen(false)
  }

  return (
    <div className="relative" ref={boxRef}>
      {label && <label className="text-sm font-medium block mb-1">{label}</label>}
      <input
        className="w-full border rounded p-2"
        placeholder={placeholder}
        value={q}
        onChange={(e)=>{ setQ(e.target.value); setOpen(true) }}
        onFocus={()=> setOpen(true)}
      />
      {open && items.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full max-h-60 overflow-auto bg-white border rounded shadow">
          {items.map((it, i) => (
            <li
              key={i}
              className="px-3 py-2 text-sm hover:bg-neutral-100 cursor-pointer"
              onClick={() => selectItem(it)}
            >
              {it.address}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function useDebounce(value, delay=250) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const id = setTimeout(()=> setV(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return v
}
