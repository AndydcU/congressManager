'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FormularioInscripcionModal from '@/components/FormularioInscripcionModal';

export default function InscripcionPage() {
  const [user, setUser] = useState(null);
  const [participante, setParticipante] = useState(null);
  const [participanteId, setParticipanteId] = useState(null);
  const [talleres, setTalleres] = useState([]);
  const [competencias, setCompetencias] = useState([]);
  const [misTalleres, setMisTalleres] = useState([]);
  const [misCompetencias, setMisCompetencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState(null);
  
  // Estados para el modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actividadSeleccionada, setActividadSeleccionada] = useState(null);
  const [tipoActividadSeleccionada, setTipoActividadSeleccionada] = useState(null);
  
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      // Guardar URL de retorno antes de redirigir al login
      localStorage.setItem('returnUrl', '/inscripcion');
      router.push('/login');
      return;
    }
    const parsed = JSON.parse(storedUser);
    setUser(parsed);

    // Buscar participante_id por correo
    fetchParticipanteId(parsed.correo);
  }, [router]);

  const fetchParticipanteId = async (correo) => {
    try {
      const res = await fetch(`/api/participantes?busqueda=${encodeURIComponent(correo)}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const participanteData = data[0];
        const pid = participanteData.id;
        setParticipanteId(pid);
        setParticipante(participanteData);
        localStorage.setItem('participante_id', pid);
        fetchData(pid);
      } else {
        setMensaje({ type: 'error', text: 'No se encontró tu registro de participante. Contacta al administrador.' });
        setLoading(false);
      }
    } catch (err) {
      setMensaje({ type: 'error', text: 'Error al buscar tu participante.' });
      setLoading(false);
    }
  };

  const fetchData = async (pid) => {
    setLoading(true);
    try {
      const [tRes, cRes, mtRes, mcRes] = await Promise.all([
        fetch('/api/talleres'),
        fetch('/api/competencias'),
        fetch(`/api/inscripciones?participante_id=${pid}`),
        fetch(`/api/inscripciones-competencias?participante_id=${pid}`)
      ]);

      const tData = await tRes.json();
      const cData = await cRes.json();
      const mtData = await mtRes.json();
      const mcData = await mcRes.json();

      setTalleres(Array.isArray(tData) ? tData : []);
      setCompetencias(Array.isArray(cData) ? cData : []);
      setMisTalleres(Array.isArray(mtData) ? mtData : []);
      setMisCompetencias(Array.isArray(mcData) ? mcData : []);
    } catch (err) {
      setMensaje({ type: 'error', text: 'Error al cargar actividades.' });
    } finally {
      setLoading(false);
    }
  };

  const abrirModalTaller = (taller) => {
    // Si tiene costo, redirigir a la página de pago
    if (taller.precio && parseFloat(taller.precio) > 0) {
      router.push(`/pago?tipo=taller&id=${taller.id}&monto=${taller.precio}`);
      return;
    }
    
    setActividadSeleccionada(taller);
    setTipoActividadSeleccionada('taller');
    setIsModalOpen(true);
  };

  const abrirModalCompetencia = (competencia) => {
    // Si tiene costo, redirigir a la página de pago
    if (competencia.precio && parseFloat(competencia.precio) > 0) {
      router.push(`/pago?tipo=competencia&id=${competencia.id}&monto=${competencia.precio}`);
      return;
    }
    
    setActividadSeleccionada(competencia);
    setTipoActividadSeleccionada('competencia');
    setIsModalOpen(true);
  };

  const handleInscripcion = async (formData) => {
    if (!participanteId || !actividadSeleccionada) return;
    
    setMensaje(null);
    
    try {
      const endpoint = tipoActividadSeleccionada === 'taller' 
        ? '/api/inscripciones' 
        : '/api/inscripciones-competencias';
      
      const body = tipoActividadSeleccionada === 'taller'
        ? { participante_id: participanteId, taller_id: actividadSeleccionada.id, ...formData }
        : { participante_id: participanteId, competencia_id: actividadSeleccionada.id, ...formData };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setMensaje({ 
          type: 'success', 
          text: `¡Inscripción exitosa! ${data.emailSent ? 'Se ha enviado un correo de confirmación.' : ''}`
        });
        setIsModalOpen(false);
        setActividadSeleccionada(null);
        setTipoActividadSeleccionada(null);
        fetchData(participanteId);
      } else {
        throw new Error(data.error || 'Error al inscribirse');
      }
    } catch (err) {
      throw new Error(err.message || 'Error de red');
    }
  };

  const cerrarModal = () => {
    setIsModalOpen(false);
    setActividadSeleccionada(null);
    setTipoActividadSeleccionada(null);
  };

  const estaInscritoTaller = (tallerId) => misTalleres.some(t => t.taller_id === tallerId);
  const estaInscritoCompetencia = (compId) => misCompetencias.some(c => c.competencia_id === compId);

  if (!user) return <p className="text-center mt-10">Verificando sesión...</p>;
  if (loading) return <p className="text-center mt-10">Cargando actividades...</p>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-8">
      <header className="text-center space-y-2">
        <h1 className="text-4xl font-bold">Inscripción a Talleres y Competencias</h1>
        <p className="text-gray-600">Hola, <strong>{user.nombre}</strong>. Selecciona las actividades en las que deseas participar.</p>
      </header>

      {mensaje && (
        <div className={`p-4 rounded ${mensaje.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {mensaje.text}
        </div>
      )}

      {/* Mis Inscripciones */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-semibold mb-4">Mis Inscripciones</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-2">Talleres ({misTalleres.length})</h3>
            {misTalleres.length === 0 ? (
              <p className="text-gray-500 text-sm">No estás inscrito en ningún taller</p>
            ) : (
              <ul className="space-y-2">
                {misTalleres.map((t) => (
                  <li key={t.id} className="p-2 bg-blue-50 rounded text-sm">
                    <strong>{t.nombre}</strong>
                    {t.fecha && <div className="text-xs text-gray-600">📅 {new Date(t.fecha).toLocaleDateString('es-GT')}</div>}
                    <div className="text-xs text-gray-600">🕐 {t.horario}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h3 className="font-semibold mb-2">Competencias ({misCompetencias.length})</h3>
            {misCompetencias.length === 0 ? (
              <p className="text-gray-500 text-sm">No estás inscrito en ninguna competencia</p>
            ) : (
              <ul className="space-y-2">
                {misCompetencias.map((c) => (
                  <li key={c.id} className="p-2 bg-indigo-50 rounded text-sm">
                    <strong>{c.nombre}</strong>
                    {c.fecha && <div className="text-xs text-gray-600">📅 {new Date(c.fecha).toLocaleDateString('es-GT')}</div>}
                    <div className="text-xs text-gray-600">🕐 {c.horario}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* Talleres Disponibles */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-semibold mb-4">Talleres Disponibles</h2>
        {talleres.length === 0 ? (
          <p className="text-gray-500">No hay talleres disponibles</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {talleres.map((t) => {
              const inscrito = estaInscritoTaller(t.id);
              return (
                <div key={t.id} className="border rounded-lg p-4 space-y-2">
                  <h3 className="font-semibold text-lg">{t.nombre}</h3>
                  <p className="text-sm text-gray-600">{t.descripcion}</p>
                  {t.fecha_realizacion && <p className="text-sm"><strong>📅 Fecha:</strong> {new Date(t.fecha_realizacion).toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' })}</p>}
                  <p className="text-sm"><strong>🕐 Horario:</strong> {t.horario || 'Por definir'}</p>
                  <p className="text-sm"><strong>👥 Cupo:</strong> {t.cupo}</p>
                  {t.precio && parseFloat(t.precio) > 0 && (
                    <p className="text-sm font-semibold text-green-700">💰 Costo: Q{parseFloat(t.precio).toFixed(2)}</p>
                  )}
                  <button
                    onClick={() => abrirModalTaller(t)}
                    disabled={inscrito}
                    className={`w-full py-2 rounded text-sm font-medium ${
                      inscrito
                        ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {inscrito ? 'Ya inscrito' : (t.precio && parseFloat(t.precio) > 0 ? '💳 Pagar e Inscribirse' : 'Inscribirme')}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Competencias Disponibles */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-semibold mb-4">Competencias Disponibles</h2>
        {competencias.length === 0 ? (
          <p className="text-gray-500">No hay competencias disponibles</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {competencias.map((c) => {
              const inscrito = estaInscritoCompetencia(c.id);
              return (
                <div key={c.id} className="border rounded-lg p-4 space-y-2 border-l-4 border-indigo-600">
                  <h3 className="font-semibold text-lg">{c.nombre}</h3>
                  <p className="text-sm text-gray-600">{c.descripcion}</p>
                  {c.fecha_realizacion && <p className="text-sm"><strong>📅 Fecha:</strong> {new Date(c.fecha_realizacion).toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' })}</p>}
                  <p className="text-sm"><strong>🕐 Horario:</strong> {c.horario || 'Por definir'}</p>
                  <p className="text-sm"><strong>👥 Cupo:</strong> {c.cupo}</p>
                  {c.precio && parseFloat(c.precio) > 0 && (
                    <p className="text-sm font-semibold text-green-700">💰 Costo: Q{parseFloat(c.precio).toFixed(2)}</p>
                  )}
                  <button
                    onClick={() => abrirModalCompetencia(c)}
                    disabled={inscrito}
                    className={`w-full py-2 rounded text-sm font-medium ${
                      inscrito
                        ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {inscrito ? 'Ya inscrito' : (c.precio && parseFloat(c.precio) > 0 ? '💳 Pagar e Inscribirse' : 'Inscribirme')}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Modal de Formulario Dinámico */}
      <FormularioInscripcionModal
        isOpen={isModalOpen}
        onClose={cerrarModal}
        onSubmit={handleInscripcion}
        actividad={actividadSeleccionada}
        tipoActividad={tipoActividadSeleccionada}
        participante={participante}
      />
    </div>
  );
}
