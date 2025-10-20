// src/pages/Deals.jsx
import { useState } from 'react'

export default function Deals(){
  const [origin,setOrigin] = useState(null)
  const [destination,setDestination] = useState(null)
  const [when,setWhen] = useState('')

  const offers = simulateOffers(origin,destination,when)

  return (
    <main className="p-4 max-w-md mx-auto grid gap-3">
      <h1 className="text-xl font-bold">Viajes rápidos (MVP)</h1>

      {/* Aquí podrías reusar MapPicker para origen/destino */}

      <ul className="grid gap-3">
        {offers.map(o=>(
          <li key={o.id} className="border rounded p-3">
            <div className="flex justify-between">
              <div>
                <p className="font-medium">{o.name}</p>
                <p className="text-sm text-gray-600">ETA {o.eta} min · desde {o.price}</p>
              </div>
              <a
                className="rounded bg-black text-white px-3 py-2 text-sm"
                href={o.url}
                target="_blank" rel="noreferrer"
              >
                Solicitar
              </a>
            </div>
          </li>
        ))}
      </ul>
    </main>
  )
}

function simulateOffers(origin,destination,when){
  // usa tus datos para armar URLs. Por ahora, enlaces a tu propio “/prefill”
  const q = new URLSearchParams({
    from: origin ? `${origin.lat},${origin.lng}` : '',
    to: destination ? `${destination.lat},${destination.lng}` : '',
    when: when || ''
  }).toString()

  return [
    { id:'eco', name:'Económico (simulado)', eta: 5, price: '$3.500', url:`/prefill?${q}&p=eco` },
    { id:'conf', name:'Confort (simulado)',  eta: 7, price: '$5.200', url:`/prefill?${q}&p=conf` },
  ]
}
