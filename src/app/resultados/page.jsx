'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ResultadosPage() {
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const anioActual = new Date().getFullYear();

  useEffect(() => {
    fetchResultados();
  }, []);

  const fetchResultados = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/resultados?anio=${anioActual}`, { cache: 'no-store' });
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

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-8">
      <header className="text-center space-y-2">
        <h1 className="text-4xl font-bold">Resultados del Congreso {anioActual}</h1>
        <p className="text-gray-600">Ganadores de las competencias</p>
        <Link href="/resultados/historico" className="inline-block mt-2 text-blue-600 hover:underline">
          Ver histórico de años anteriores →
        </Link>
      </header>

      {loading && <p className="text-center text-gray-500">Cargando resultados...</p>}
      {error && <p className="text-center text-red-600">{error}</p>}

      {!loading && !error && resultados.length === 0 && (
        <p className="text-center text-gray-500">No hay resultados publicados para este año.</p>
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
