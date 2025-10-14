'use client';
import { useEffect, useState } from 'react';

export default function TalleresYCompetencias() {
  const [talleres, setTalleres] = useState([]);
  const [inscritos, setInscritos] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(true);

  //  Recuperar ID del participante desde localStorage (lo guardaremos al inscribirse)
  const [participanteId, setParticipanteId] = useState(null);

  useEffect(() => {
    const idGuardado = localStorage.getItem('participante_id');
    if (idGuardado) {
      setParticipanteId(parseInt(idGuardado));
      cargarDatos(parseInt(idGuardado));
    } else {
      setCargando(false);
      setMensaje('⚠️ Primero debes registrarte en la página de inscripción.');
    }
  }, []);

  const cargarDatos = async (id) => {
    try {
      const [resTalleres, resInscripciones] = await Promise.all([
        fetch('/api/talleres'),
        fetch(`/api/inscripciones?participante_id=${id}`)
      ]);

      const talleresData = await resTalleres.json();
      const inscripcionesData = await resInscripciones.json();

      setTalleres(talleresData);
      setInscritos(inscripcionesData.map(i => i.taller_id));
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setMensaje('❌ Error al cargar talleres.');
    } finally {
      setCargando(false);
    }
  };

  const inscribirse = async (tallerId) => {
    if (!participanteId) return;
    setMensaje('');
    try {
      const res = await fetch('/api/inscripciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participante_id: participanteId, taller_id: tallerId }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Error desconocido');
      setMensaje(`✅ ${data.message}`);
      setInscritos((prev) => [...prev, tallerId]);
    } catch (error) {
      setMensaje(`⚠️ ${error.message}`);
    }
  };

  if (cargando) return <p className="text-center mt-8">Cargando actividades...</p>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-6">🧩 Talleres y Competencias</h1>

      {mensaje && <p className="text-center text-blue-700 font-medium mb-4">{mensaje}</p>}

      {!participanteId ? (
        <div className="text-center text-gray-600">
          <p>
            Para inscribirte en talleres o competencias, primero registra tus datos en{' '}
            <code>/inscripcion</code>.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {talleres.map((t) => {
            const yaInscrito = inscritos.includes(t.id);
            return (
              <div
                key={t.id}
                className="bg-white p-5 rounded-lg shadow border hover:shadow-md transition"
              >
                <h2 className="text-xl font-semibold mb-2">{t.nombre}</h2>
                <p className="text-gray-600 mb-2">{t.descripcion}</p>
                <p>
                  <strong>Horario:</strong> {t.horario}
                </p>
                <p>
                  <strong>Tipo:</strong> {t.tipo}
                </p>
                <p>
                  <strong>Cupo:</strong> {t.cupo}
                </p>

                <button
                  onClick={() => inscribirse(t.id)}
                  disabled={yaInscrito}
                  className={`mt-4 w-full py-2 font-semibold rounded-lg ${
                    yaInscrito
                      ? 'bg-gray-400 cursor-not-allowed'
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
    </div>
  );
}
