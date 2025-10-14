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

  if (cargando) return <p className="text-center mt-8">Cargando actividades...</p>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <h1 className="text-4xl font-bold text-center">Talleres y Competencias</h1>

      {mensaje && (
        <div className={`p-4 rounded text-center ${mensaje.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {mensaje}
        </div>
      )}

      <section>
        <h2 className="text-2xl font-semibold mb-4">Talleres Disponibles</h2>
        {talleres.length === 0 ? (
          <p className="text-gray-500">No hay talleres disponibles</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {talleres.map((t) => {
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
                  <button
                    onClick={() => inscribirseTaller(t.id)}
                    disabled={yaInscrito}
                    className={`mt-3 w-full py-2 font-semibold rounded-lg ${
                      yaInscrito
                        ? 'bg-gray-400 cursor-not-allowed text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {yaInscrito ? 'Ya inscrito' : 'Inscribirme'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Competencias Disponibles</h2>
        {competencias.length === 0 ? (
          <p className="text-gray-500">No hay competencias disponibles</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {competencias.map((c) => {
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
                  <button
                    onClick={() => inscribirseCompetencia(c.id)}
                    disabled={yaInscrito}
                    className={`mt-3 w-full py-2 font-semibold rounded-lg ${
                      yaInscrito
                        ? 'bg-gray-400 cursor-not-allowed text-white'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    {yaInscrito ? 'Ya inscrito' : 'Inscribirme'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
