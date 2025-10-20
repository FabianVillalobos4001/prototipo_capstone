import { useLocation } from 'react-router-dom'

export default function Estimates() {
  const { state } = useLocation()
  const estimates = state?.estimates || []
  const criteria = state?.criteria

  return (
    <main className="min-h-screen p-4 grid gap-4">
      <h1 className="text-xl font-bold">Estimaciones</h1>
      {criteria && (
        <p className="text-sm text-black/60">
          {criteria.origin} → {criteria.destination} · {criteria.zone} · {criteria.time}
        </p>
      )}
      <section className="grid gap-3">
        {estimates.length === 0 && <p>No hay estimaciones disponibles.</p>}
        {estimates.map((e,i) => (
          <div key={i} className="border rounded-xl p-3 grid gap-1">
            <div className="font-semibold">{e.serviceName}</div>
            <div className="text-sm">Tarifa estimada: {e.price}</div>
            <div className="text-sm text-black/60">ETA: {e.eta} min</div>
          </div>
        ))}
      </section>
    </main>
  )
}
