import { Link } from "react-router-dom";
import Button from "../components/Button";

export default function Home() {
  return (
    <div className="flex flex-col justify-between min-h-[80vh] px-6 py-8">
      {/* Contenido principal */}
      <div>
        <h1 className="text-2xl font-bold mb-4 text-gray-900">
          Esta aplicación web te permite:
        </h1>

        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <span className="mt-0.5 text-black-600">➤</span>
            <p className="text-gray-700">
              Registrar horarios, zonas y destinos.
            </p>
          </li>

          <li className="flex items-start gap-3">
            <span className="mt-0.5 text-black-600">➤</span>
            <p className="text-gray-700">
              Coordinar automáticamente trayectos compartidos.
            </p>
          </li>

          <li className="flex items-start gap-3">
            <span className="mt-0.5 text-black-600">➤</span>
            <p className="text-gray-700">
              Visualizar opciones de transporte disponibles.
            </p>
          </li>
        </ul>
      </div>

      {/* Botón inferior */}
      <div className="mt-8">
        <Link to="/request">
          <Button>Solicitar viaje</Button>
        </Link>
      </div>
    </div>
  );
}
