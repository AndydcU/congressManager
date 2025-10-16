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

  const actividadFinalizada = (fecha, horaFin) => {
    if (!fecha || !horaFin) return false;
    
    const ahora = new Date();
    const fechaActividad = new Date(fecha);
    const [horas, minutos] = horaFin.split(':');
    
    fechaActividad.setHours(parseInt(horas), parseInt(minutos), 0);
    
    return ahora > fechaActividad;
  };

  if (loading) return <p className="text-center mt-8">Cargando talleres...</p>;

  const talleresActivos = talleres.filter(t => !actividadFinalizada(t.fecha, t.hora_fin));
  const talleresRecientes = talleres.filter(t => actividadFinalizada(t.fecha, t.hora_fin));

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Talleres Activos */}
      <div>
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
            📚 Talleres Disponibles
            {talleresActivos.length > 0 && (
              <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                {talleresActivos.length} activos
              </span>
            )}
          </h1>
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

        {talleresActivos.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500 text-lg">No hay talleres disponibles en este momento</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {talleresActivos.map((t) => (
              <div
                key={t.id}
                className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-600 hover:shadow-lg transition-shadow"
              >
                <h2 className="text-xl font-bold mb-3 text-blue-900">{t.nombre}</h2>
                <p className="text-gray-700 mb-4 text-sm">{t.descripcion}</p>
                
                <div className="space-y-2 text-sm">
                  {t.fecha && (
                    <p className="flex items-center gap-2">
                      <span className="font-semibold text-gray-700">📅 Fecha:</span>
                      <span className="text-gray-600">{new Date(t.fecha).toLocaleDateString('es-GT', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</span>
                    </p>
                  )}
                  {(t.hora_inicio && t.hora_fin) ? (
                    <p className="flex items-center gap-2">
                      <span className="font-semibold text-gray-700">🕐 Horario:</span>
                      <span className="text-gray-600">{t.hora_inicio} - {t.hora_fin}</span>
                    </p>
                  ) : (
                    <p className="flex items-center gap-2">
                      <span className="font-semibold text-gray-700">🕐 Horario:</span>
                      <span className="text-gray-600">Por confirmar</span>
                    </p>
                  )}
                  <p className="flex items-center gap-2">
                    <span className="font-semibold text-gray-700">💵 Precio:</span>
                    <span className="text-gray-600 font-bold">
                      {t.costo && parseFloat(t.costo) > 0 ? `Q${parseFloat(t.costo).toFixed(2)}` : 'Gratis'}
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

      {/* Talleres Recientes */}
      {talleresRecientes.length > 0 && (
        <div className="mt-12">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold mb-2 flex items-center justify-center gap-3">
              📖 Talleres Recientes
              <span className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                {talleresRecientes.length} finalizados
              </span>
            </h2>
            <p className="text-gray-600 text-sm">
              Estos talleres ya finalizaron. No es posible inscribirse.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {talleresRecientes.map((t) => (
              <div
                key={t.id}
                className="bg-gray-50 p-6 rounded-lg border border-gray-300 border-l-4 border-l-gray-400 opacity-75"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-700">{t.nombre}</h3>
                  <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">Finalizado</span>
                </div>
                <p className="text-gray-500 text-sm mb-3">{t.descripcion}</p>
                
                <div className="space-y-1 text-sm text-gray-600">
                  {t.fecha && (
                    <p>📅 {new Date(t.fecha).toLocaleDateString('es-GT', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</p>
                  )}
                  {(t.hora_inicio && t.hora_fin) && (
                    <p>🕐 {t.hora_inicio} - {t.hora_fin}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
