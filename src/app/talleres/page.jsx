'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TalleresPage() {
  const [talleres, setTalleres] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchTalleres();
  }, []);

  const fetchTalleres = async () => {
    try {
      const res = await fetch('/api/talleres');
      const data = await res.json();
      setTalleres(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al cargar talleres:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p className="text-center mt-8">Cargando talleres...</p>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">📚 Talleres Disponibles</h1>
        <p className="text-gray-600">
          Explora los talleres disponibles. Para inscribirte, ve a la sección de{' '}
          <button
            onClick={() => router.push('/inscripcion')}
            className="text-blue-600 hover:underline font-semibold"
          >
            Inscripción
          </button>
        </p>
      </div>

      {talleres.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-lg">No hay talleres disponibles en este momento</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {talleres.map((t) => (
            <div
              key={t.id}
              className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-600 hover:shadow-lg transition-shadow"
            >
              <h2 className="text-xl font-bold mb-3 text-blue-900">{t.nombre}</h2>
              <p className="text-gray-700 mb-4 text-sm">{t.descripcion}</p>
              
              <div className="space-y-2 text-sm">
                {t.fecha_realizacion && (
                  <p className="flex items-center gap-2">
                    <span className="font-semibold text-gray-700">📅 Fecha:</span>
                    <span className="text-gray-600">{new Date(t.fecha_realizacion).toLocaleDateString('es-GT', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</span>
                  </p>
                )}
                <p className="flex items-center gap-2">
                  <span className="font-semibold text-gray-700">🕐 Horario:</span>
                  <span className="text-gray-600">{t.horario || 'Por confirmar'}</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="font-semibold text-gray-700">💵 Precio:</span>
                  <span className="text-gray-600 font-bold">
                    {t.precio > 0 ? `Q${parseFloat(t.precio).toFixed(2)}` : 'Gratis'}
                  </span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="font-semibold text-gray-700">👥 Cupo:</span>
                  <span className="text-gray-600">{t.cupo} personas</span>
                </p>
              </div>

              <button
                onClick={() => router.push('/inscripcion')}
                className="mt-5 w-full py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
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
