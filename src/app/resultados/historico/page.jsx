'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function HistoricoPage() {
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear() - 1);

  useEffect(() => {
    if (anioSeleccionado) fetchResultados();
  }, [anioSeleccionado]);

  const fetchResultados = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/resultados?anio=${anioSeleccionado}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResultados(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('No se pudieron cargar los resultados.');
    } finally {
      setLoading(false);
    }
  };

  // Agrupar por competencia
  const porCompetencia = resultados.reduce((acc, r) => {
    const key = r.competencia_id;
    if (!acc[key]) {
      acc[key] = { nombre: r.competencia, ganadores: [] };
    }
    acc[key].ganadores.push(r);
    return acc;
  }, {});

  // Generar opciones de años (últimos 10 años)
  const anioActual = new Date().getFullYear();
  const anios = Array.from({ length: 10 }, (_, i) => anioActual - i);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-8">
      <header className="text-center space-y-2">
        <h1 className="text-4xl font-bold">Histórico de Resultados</h1>
        <p className="text-gray-600">Ganadores de años anteriores</p>
        <Link href="/resultados" className="inline-block mt-2 text-blue-600 hover:underline">
          ← Volver a resultados del año actual
        </Link>
      </header>

      <div className="flex justify-center">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Seleccionar año:</label>
          <select
            value={anioSeleccionado}
            onChange={(e) => setAnioSeleccionado(Number(e.target.value))}
            className="border rounded px-4 py-2 text-lg"
          >
            {anios.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && <p className="text-center text-gray-500">Cargando resultados...</p>}
      {error && <p className="text-center text-red-600">{error}</p>}

      {!loading && !error && resultados.length === 0 && (
        <p className="text-center text-gray-500">No hay resultados publicados para el año {anioSeleccionado}.</p>
      )}

      {!loading && !error && Object.keys(porCompetencia).length > 0 && (
        <div className="space-y-10">
          {Object.values(porCompetencia).map((comp, idx) => (
            <section key={idx} className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-semibold mb-4 border-b pb-2">{comp.nombre}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {comp.ganadores.map((g) => (
                  <div key={g.id} className="border rounded-lg p-4 space-y-3">
                    {g.foto_url && (
                      <img
                        src={g.foto_url}
                        alt={g.proyecto || 'Proyecto'}
                        className="w-full h-48 object-cover rounded"
                      />
                    )}
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-blue-600">Puesto {g.puesto}</p>
                      {g.participante && (
                        <p className="font-medium">{g.participante}</p>
                      )}
                      {g.proyecto && (
                        <p className="text-gray-700 font-semibold">{g.proyecto}</p>
                      )}
                      {g.descripcion && (
                        <p className="text-sm text-gray-600">{g.descripcion}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
