'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CompetenciasPage() {
  const [competencias, setCompetencias] = useState([]);
  const [inscritosCompetencias, setInscritosCompetencias] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      if (parsed.id) {
        fetchData(parsed.id);
      } else {
        fetchCompetencias();
      }
    } else {
      fetchCompetencias();
    }
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

  const fetchData = async (usuarioId) => {
    try {
      const [resCompetencias, resInscritos] = await Promise.all([
        fetch('/api/competencias'),
        fetch(`/api/inscripciones-competencias?usuario_id=${usuarioId}`)
      ]);

      const competenciasData = await resCompetencias.json();
      const inscritosData = await resInscritos.json();

      setCompetencias(Array.isArray(competenciasData) ? competenciasData : []);
      setInscritosCompetencias(Array.isArray(inscritosData) ? inscritosData.map(i => i.competencia_id) : []);
    } catch (error) {
      console.error('Error al cargar datos:', error);
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

  if (loading) return <p className="text-center mt-8">Cargando competencias...</p>;

  const competenciasActivas = competencias.filter(c => !actividadFinalizada(c.fecha, c.hora_fin));
  const competenciasRecientes = competencias.filter(c => actividadFinalizada(c.fecha, c.hora_fin));

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Competencias Activas */}
      <div>
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
            🏆 Competencias Disponibles
            {competenciasActivas.length > 0 && (
              <span className="text-sm bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full">
                {competenciasActivas.length} activas
              </span>
            )}
          </h1>
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

        {competenciasActivas.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500 text-lg">No hay competencias disponibles en este momento</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {competenciasActivas.map((c) => {
              const yaInscrito = inscritosCompetencias.includes(c.id);
              return (
                <div
                  key={c.id}
                  className="bg-white p-6 rounded-lg shadow-md border-l-4 border-indigo-600 hover:shadow-lg transition-shadow"
                >
                  <h2 className="text-xl font-bold mb-3 text-indigo-900">{c.nombre}</h2>
                  <p className="text-gray-700 mb-4 text-sm">{c.descripcion}</p>
                  
                  <div className="space-y-2 text-sm">
                    {c.fecha && (
                      <p className="flex items-center gap-2">
                        <span className="font-semibold text-gray-700">📅 Fecha:</span>
                        <span className="text-gray-600">{new Date(c.fecha).toLocaleDateString('es-GT', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}</span>
                      </p>
                    )}
                    {(c.hora_inicio && c.hora_fin) ? (
                      <p className="flex items-center gap-2">
                        <span className="font-semibold text-gray-700">🕐 Horario:</span>
                        <span className="text-gray-600">{c.hora_inicio} - {c.hora_fin}</span>
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
                        {c.costo && parseFloat(c.costo) > 0 ? `Q${parseFloat(c.costo).toFixed(2)}` : 'Gratis'}
                      </span>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="font-semibold text-gray-700">👥 Cupo:</span>
                      <span className="text-gray-600">{c.cupo} personas</span>
                    </p>
                  </div>

                  {yaInscrito ? (
                    <div className="mt-5 w-full py-2 bg-green-100 text-green-800 border-2 border-green-300 font-semibold rounded-lg text-center">
                      ✓ Ya inscrito
                    </div>
                  ) : (
                    <button
                      onClick={() => router.push('/inscripcion')}
                      className="mt-5 w-full py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Inscribirme
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Competencias Recientes */}
      {competenciasRecientes.length > 0 && (
        <div className="mt-12">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold mb-2 flex items-center justify-center gap-3">
              🏅 Competencias Recientes
              <span className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                {competenciasRecientes.length} finalizadas
              </span>
            </h2>
            <p className="text-gray-600 text-sm">
              Estas competencias ya finalizaron. No es posible inscribirse.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {competenciasRecientes.map((c) => {
              const yaInscrito = inscritosCompetencias.includes(c.id);
              return (
                <div
                  key={c.id}
                  className="bg-gray-50 p-6 rounded-lg border border-gray-300 border-l-4 border-l-gray-400 opacity-75"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-700">{c.nombre}</h3>
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">Finalizada</span>
                  </div>
                  <p className="text-gray-500 text-sm mb-3">{c.descripcion}</p>
                  
                  <div className="space-y-1 text-sm text-gray-600">
                    {c.fecha && (
                      <p>📅 {new Date(c.fecha).toLocaleDateString('es-GT', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</p>
                    )}
                    {(c.hora_inicio && c.hora_fin) && (
                      <p>🕐 {c.hora_inicio} - {c.hora_fin}</p>
                    )}
                  </div>

                  {yaInscrito && (
                    <p className="text-xs text-blue-600 mt-3 flex items-center gap-1">
                      <span>✓</span> Participaste en esta competencia
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
