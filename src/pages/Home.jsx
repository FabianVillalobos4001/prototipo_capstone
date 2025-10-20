import { Link } from 'react-router-dom'
import Button from '../components/Button'

export default function Home() {
  return (
    <main className="min-h-screen p-4 grid gap-4">
      <h1 className="text-xl font-bold">Coordinación de viajes</h1>
      <p className="text-sm text-black/70">Solicita un viaje por zona y horario. El backend consultará tarifas (Uber) y propondrá coincidencias.</p>
      <Link to="/request"><Button>Solicitar viaje</Button></Link>
    </main>
  )
}
