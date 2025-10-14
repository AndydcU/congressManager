'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CompetenciasPage() {
  const [competencias, setCompetencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchCompetencias();
  }, []);

  const fetchCompetencias = async () => {
    try {
      const res = await fetch('/api/competencias');
      const data = await res.json();
      setCompetencias(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al cargar competencias:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p className="text-center mt-8">Cargando competencias...</p>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">🏆 Competencias Disponibles</h1>
        <p className="text-gray-600">
          Explora las competencias disponibles. Para inscribirte, ve a la sección de{' '}
          <button
            onClick={() => router.push('/inscripcion')}
            className="text-indigo-600 hover:underline font-semibold"
          >
            Inscripción
          </button>
        </p>
      </div>

      {competencias.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-lg">No hay competencias disponibles en este momento</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {competencias.map((c) => (
            <div
              key={c.id}
              className="bg-white p-6 rounded-lg shadow-md border-l-4 border-indigo-600 hover:shadow-lg transition-shadow"
            >
              <h2 className="text-xl font-bold mb-3 text-indigo-900">{c.nombre}</h2>
              <p className="text-gray-700 mb-4 text-sm">{c.descripcion}</p>
              
              <div className="space-y-2 text-sm">
                {c.fecha_realizacion && (
                  <p className="flex items-center gap-2">
                    <span className="font-semibold text-gray-700">📅 Fecha:</span>
                    <span className="text-gray-600">{new Date(c.fecha_realizacion).toLocaleDateString('es-GT', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</span>
                  </p>
                )}
                <p className="flex items-center gap-2">
                  <span className="font-semibold text-gray-700">🕐 Horario:</span>
                  <span className="text-gray-600">{c.horario || 'Por confirmar'}</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="font-semibold text-gray-700">💵 Precio:</span>
                  <span className="text-gray-600 font-bold">
                    {c.precio > 0 ? `Q${parseFloat(c.precio).toFixed(2)}` : 'Gratis'}
                  </span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="font-semibold text-gray-700">👥 Cupo:</span>
                  <span className="text-gray-600">{c.cupo} personas</span>
                </p>
              </div>

              <button
                onClick={() => router.push('/inscripcion')}
                className="mt-5 w-full py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Inscribirme
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
