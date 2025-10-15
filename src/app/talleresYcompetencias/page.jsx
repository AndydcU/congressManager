'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TalleresYCompetencias() {
  const [talleres, setTalleres] = useState([]);
  const [competencias, setCompetencias] = useState([]);
  const [inscritosTalleres, setInscritosTalleres] = useState([]);
  const [inscritosCompetencias, setInscritosCompetencias] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(true);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    const parsed = JSON.parse(storedUser);
    setUser(parsed);
    
    if (parsed.id) {
      cargarDatos(parsed.id);
    } else {
      setCargando(false);
      setMensaje('⚠️ No se encontró tu ID de usuario.');
    }
  }, [router]);

  const cargarDatos = async (usuarioId) => {
    try {
      const [resTalleres, resCompetencias, resInscTalleres, resInscCompetencias] = await Promise.all([
        fetch('/api/talleres'),
        fetch('/api/competencias'),
        fetch(`/api/inscripciones?usuario_id=${usuarioId}`),
        fetch(`/api/inscripciones-competencias?usuario_id=${usuarioId}`)
      ]);

      const talleresData = await resTalleres.json();
      const competenciasData = await resCompetencias.json();
      const inscTalleresData = await resInscTalleres.json();
      const inscCompetenciasData = await resInscCompetencias.json();

      setTalleres(Array.isArray(talleresData) ? talleresData : []);
      setCompetencias(Array.isArray(competenciasData) ? competenciasData : []);
      setInscritosTalleres(Array.isArray(inscTalleresData) ? inscTalleresData.map(i => i.taller_id) : []);
      setInscritosCompetencias(Array.isArray(inscCompetenciasData) ? inscCompetenciasData.map(i => i.competencia_id) : []);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setMensaje('❌ Error al cargar actividades.');
    } finally {
      setCargando(false);
    }
  };

  const inscribirseTaller = async (tallerId) => {
    if (!user?.id) return;
    setMensaje('');
    try {
      const res = await fetch('/api/inscripciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id: user.id, taller_id: tallerId }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Error desconocido');
      setMensaje(`✅ ${data.message}`);
      setInscritosTalleres((prev) => [...prev, tallerId]);
    } catch (error) {
      setMensaje(`⚠️ ${error.message}`);
    }
  };

  const inscribirseCompetencia = async (competenciaId) => {
    if (!user?.id) return;
    setMensaje('');
    try {
      const res = await fetch('/api/inscripciones-competencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id: user.id, competencia_id: competenciaId }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Error desconocido');
      setMensaje(`✅ ${data.message}`);
      setInscritosCompetencias((prev) => [...prev, competenciaId]);
    } catch (error) {
      setMensaje(`⚠️ ${error.message}`);
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

  const separarActividades = (actividades) => {
    const activas = [];
    const recientes = [];
    
    actividades.forEach(act => {
      if (actividadFinalizada(act.fecha, act.hora_fin)) {
        recientes.push(act);
      } else {
        activas.push(act);
      }
    });
    
    return { activas, recientes };
  };

  if (cargando) return <p className="text-center mt-8">Cargando actividades...</p>;

  const { activas: talleresActivos, recientes: talleresRecientes } = separarActividades(talleres);
  const { activas: competenciasActivas, recientes: competenciasRecientes } = separarActividades(competencias);
  const esAdmin = user?.rol === 'admin';

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <h1 className="text-4xl font-bold text-center">Talleres y Competencias</h1>

      {esAdmin && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 text-sm flex items-center gap-2">
            <span className="text-lg">ℹ️</span>
            <span>Como administrador, tienes acceso solo a visualización. Las inscripciones están deshabilitadas para este rol.</span>
          </p>
        </div>
      )}

      {mensaje && (
        <div className={`p-4 rounded text-center ${mensaje.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {mensaje}
        </div>
      )}

      {/* TALLERES ACTIVOS */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          📚 Talleres Disponibles
          {talleresActivos.length > 0 && (
            <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
              {talleresActivos.length} activos
            </span>
          )}
        </h2>
        {talleresActivos.length === 0 ? (
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <p className="text-gray-500">No hay talleres disponibles en este momento</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {talleresActivos.map((t) => {
              const yaInscrito = inscritosTalleres.includes(t.id);
              return (
                <div key={t.id} className="bg-white p-5 rounded-lg shadow border hover:shadow-md transition">
                  <h3 className="text-xl font-semibold mb-2">{t.nombre}</h3>
                  <p className="text-gray-600 text-sm mb-3">{t.descripcion}</p>
                  {t.fecha && (
                    <p className="text-sm mb-1">
                      <strong>📅 Fecha:</strong> {new Date(t.fecha).toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  )}
                  {(t.hora_inicio && t.hora_fin) ? (
                    <p className="text-sm mb-1">
                      <strong>🕐 Horario:</strong> {t.hora_inicio} - {t.hora_fin}
                    </p>
                  ) : (
                    <p className="text-sm mb-1">
                      <strong>🕐 Horario:</strong> Por definir
                    </p>
                  )}
                  <p className="text-sm mb-1">
                    <strong>👥 Cupo:</strong> {t.cupo}
                  </p>
                  {t.costo && parseFloat(t.costo) > 0 && (
                    <p className="text-sm font-semibold text-green-700 mb-2">
                      💰 Costo: Q{parseFloat(t.costo).toFixed(2)}
                    </p>
                  )}
                  
                  {!esAdmin && (
                    <button
                      onClick={() => inscribirseTaller(t.id)}
                      disabled={yaInscrito}
                      className={`mt-3 w-full py-2 font-semibold rounded-lg transition ${
                        yaInscrito
                          ? 'bg-green-100 text-green-800 border-2 border-green-300 cursor-default'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {yaInscrito ? '✓ Ya inscrito' : 'Inscribirme'}
                    </button>
                  )}
                  {yaInscrito && (
                    <p className="text-xs text-green-600 mt-2 text-center">
                      Estás inscrito en este taller
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* TALLERES RECIENTES */}
      {talleresRecientes.length > 0 && (
        <section>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            📖 Talleres Recientes
            <span className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
              {talleresRecientes.length} finalizados
            </span>
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {talleresRecientes.map((t) => {
              const yaInscrito = inscritosTalleres.includes(t.id);
              return (
                <div key={t.id} className="bg-gray-50 p-5 rounded-lg border border-gray-300 opacity-75">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-700">{t.nombre}</h3>
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">Finalizado</span>
                  </div>
                  <p className="text-gray-500 text-sm mb-3">{t.descripcion}</p>
                  {t.fecha && (
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>📅 Fecha:</strong> {new Date(t.fecha).toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  )}
                  {yaInscrito && (
                    <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                      <span>✓</span> Participaste en este taller
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* COMPETENCIAS ACTIVAS */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          🏆 Competencias Disponibles
          {competenciasActivas.length > 0 && (
            <span className="text-sm bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full">
              {competenciasActivas.length} activas
            </span>
          )}
        </h2>
        {competenciasActivas.length === 0 ? (
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <p className="text-gray-500">No hay competencias disponibles en este momento</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {competenciasActivas.map((c) => {
              const yaInscrito = inscritosCompetencias.includes(c.id);
              return (
                <div key={c.id} className="bg-white p-5 rounded-lg shadow border border-l-4 border-indigo-600 hover:shadow-md transition">
                  <h3 className="text-xl font-semibold mb-2">{c.nombre}</h3>
                  <p className="text-gray-600 text-sm mb-3">{c.descripcion}</p>
                  {c.fecha && (
                    <p className="text-sm mb-1">
                      <strong>📅 Fecha:</strong> {new Date(c.fecha).toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  )}
                  {(c.hora_inicio && c.hora_fin) ? (
                    <p className="text-sm mb-1">
                      <strong>🕐 Horario:</strong> {c.hora_inicio} - {c.hora_fin}
                    </p>
                  ) : (
                    <p className="text-sm mb-1">
                      <strong>🕐 Horario:</strong> Por definir
                    </p>
                  )}
                  <p className="text-sm mb-1">
                    <strong>👥 Cupo:</strong> {c.cupo}
                  </p>
                  {c.costo && parseFloat(c.costo) > 0 && (
                    <p className="text-sm font-semibold text-green-700 mb-2">
                      💰 Costo: Q{parseFloat(c.costo).toFixed(2)}
                    </p>
                  )}
                  
                  {!esAdmin && (
                    <button
                      onClick={() => inscribirseCompetencia(c.id)}
                      disabled={yaInscrito}
                      className={`mt-3 w-full py-2 font-semibold rounded-lg transition ${
                        yaInscrito
                          ? 'bg-green-100 text-green-800 border-2 border-green-300 cursor-default'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      }`}
                    >
                      {yaInscrito ? '✓ Ya inscrito' : 'Inscribirme'}
                    </button>
                  )}
                  {yaInscrito && (
                    <p className="text-xs text-green-600 mt-2 text-center">
                      Estás inscrito en esta competencia
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* COMPETENCIAS RECIENTES */}
      {competenciasRecientes.length > 0 && (
        <section>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            🏅 Competencias Recientes
            <span className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
              {competenciasRecientes.length} finalizadas
            </span>
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {competenciasRecientes.map((c) => {
              const yaInscrito = inscritosCompetencias.includes(c.id);
              return (
                <div key={c.id} className="bg-gray-50 p-5 rounded-lg border border-gray-300 border-l-4 border-l-gray-400 opacity-75">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-700">{c.nombre}</h3>
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">Finalizada</span>
                  </div>
                  <p className="text-gray-500 text-sm mb-3">{c.descripcion}</p>
                  {c.fecha && (
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>📅 Fecha:</strong> {new Date(c.fecha).toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  )}
                  {yaInscrito && (
                    <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                      <span>✓</span> Participaste en esta competencia
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
