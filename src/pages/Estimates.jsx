import { useState } from "react";
import Input from "../components/Input";
import Select from "../components/Select";
import Button from "../components/Button";

const ZONES = [
  { value: "norte", label: "Zona Norte" },
  { value: "centro", label: "Zona Centro" },
  { value: "sur", label: "Zona Sur" },
];

export default function Estimates() {
  const [form, setForm] = useState({
    origin: "",
    destination: "",
    time: "",
    zone: "centro",
  });
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");

  const onChange = (k) => (e) => setForm((v) => ({ ...v, [k]: e.target.value }));

  const onSubmit = (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Simulación de estimaciones (mock)
    setTimeout(() => {
      setResults([
        {
          id: 1,
          servicio: "Transporte interno",
          tarifa: "$4.200",
          tiempo: "15–20 min",
          tipo: "Compartido",
        },
        {
          id: 2,
          servicio: "Uber (estimación)",
          tarifa: "$5.800",
          tiempo: "10–12 min",
          tipo: "Privado",
        },
      ]);
      setLoading(false);
    }, 800);
  };

  return (
    <main className="min-h-screen p-4 grid gap-4 max-w-xl mx-auto">
      <h1 className="text-xl font-bold">Estimación de viaje</h1>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <form onSubmit={onSubmit} className="grid gap-3">
        <Input
          label="Origen"
          value={form.origin}
          onChange={onChange("origin")}
          required
        />
        <Input
          label="Destino"
          value={form.destination}
          onChange={onChange("destination")}
          required
        />
        <Input
          label="Horario (HH:MM)"
          type="time"
          value={form.time}
          onChange={onChange("time")}
          required
        />
        <Select
          label="Zona"
          value={form.zone}
          onChange={onChange("zone")}
          options={ZONES}
        />
        <Button type="submit" disabled={loading}>
          {loading ? "Calculando..." : "Obtener estimación"}
        </Button>
      </form>

      {/* Resultados de estimación */}
      {results.length > 0 && (
        <section className="mt-5 space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">Resultados</h2>
          {results.map((r) => (
            <div
              key={r.id}
              className="rounded-xl border bg-white p-4 shadow-sm flex items-center justify-between"
            >
              <div>
                <p className="font-medium text-gray-900">{r.servicio}</p>
                <p className="text-sm text-gray-600">
                  {r.tarifa} • {r.tiempo} • {r.tipo}
                </p>
              </div>
              <button className="rounded-md border px-3 py-1.5 hover:bg-gray-50">
                Seleccionar
              </button>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
