'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FormularioInscripcionModal from '@/components/FormularioInscripcionModal';

export default function InscripcionPage() {
  const [user, setUser] = useState(null);
  const [usuarioId, setUsuarioId] = useState(null);
  const [talleres, setTalleres] = useState([]);
  const [competencias, setCompetencias] = useState([]);
  const [misTalleres, setMisTalleres] = useState([]);
  const [misCompetencias, setMisCompetencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actividadSeleccionada, setActividadSeleccionada] = useState(null);
  const [tipoActividadSeleccionada, setTipoActividadSeleccionada] = useState(null);
  
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      localStorage.setItem('returnUrl', '/inscripcion');
      router.push('/login');
      return;
    }
    const parsed = JSON.parse(storedUser);
    setUser(parsed);
    
    if (parsed.id) {
      setUsuarioId(parsed.id);
      fetchData(parsed.id);
    } else {
      setMensaje({ type: 'error', text: 'No se encontró tu registro de usuario. Contacta al administrador.' });
      setLoading(false);
    }
  }, [router]);

  const fetchData = async (uid) => {
    setLoading(true);
    try {
      const [tRes, cRes, mtRes, mcRes] = await Promise.all([
        fetch('/api/talleres'),
        fetch('/api/competencias'),
        fetch(`/api/inscripciones?usuario_id=${uid}`),
        fetch(`/api/inscripciones-competencias?usuario_id=${uid}`)
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
    setActividadSeleccionada(taller);
    setTipoActividadSeleccionada('taller');
    setIsModalOpen(true);
  };

  const abrirModalCompetencia = (competencia) => {
    setActividadSeleccionada(competencia);
    setTipoActividadSeleccionada('competencia');
    setIsModalOpen(true);
  };

  const handleInscripcion = async (formData) => {
    if (!usuarioId || !actividadSeleccionada) return;
    
    setMensaje(null);
    
    try {
      // Si la actividad tiene costo, primero registrar el pago
      if (actividadSeleccionada.costo && parseFloat(actividadSeleccionada.costo) > 0) {
        const pagoRes = await fetch('/api/pagos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            usuario_id: usuarioId,
            actividad_id: actividadSeleccionada.id,
            tipo_actividad: tipoActividadSeleccionada,
            monto: parseFloat(actividadSeleccionada.costo),
            metodo_pago: formData.metodo_pago || 'efectivo'
          })
        });

        if (!pagoRes.ok) {
          const errorData = await pagoRes.json();
          throw new Error(errorData.error || 'Error al registrar el pago');
        }
      }

      // Luego realizar la inscripción
      const endpoint = tipoActividadSeleccionada === 'taller' 
        ? '/api/inscripciones' 
        : '/api/inscripciones-competencias';
      
      const body = tipoActividadSeleccionada === 'taller'
        ? { usuario_id: usuarioId, taller_id: actividadSeleccionada.id, ...formData }
        : { usuario_id: usuarioId, competencia_id: actividadSeleccionada.id, ...formData };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        const mensajeExito = actividadSeleccionada.costo && parseFloat(actividadSeleccionada.costo) > 0
          ? `¡Pago e inscripción exitosos! ${data.emailSent ? 'Se han enviado correos de confirmación.' : ''}`
          : `¡Inscripción exitosa! ${data.emailSent ? 'Se ha enviado un correo de confirmación.' : ''}`;
        
        setMensaje({ 
          type: 'success', 
          text: mensajeExito
        });
        setIsModalOpen(false);
        setActividadSeleccionada(null);
        setTipoActividadSeleccionada(null);
        
        // Recargar datos para actualizar "Mis Inscripciones"
        await fetchData(usuarioId);
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
                    {(t.hora_inicio && t.hora_fin) && (
                      <div className="text-xs text-gray-600">🕐 {t.hora_inicio} - {t.hora_fin}</div>
                    )}
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
                    {(c.hora_inicio && c.hora_fin) && (
                      <div className="text-xs text-gray-600">🕐 {c.hora_inicio} - {c.hora_fin}</div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

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
                  {t.fecha && <p className="text-sm"><strong>📅 Fecha:</strong> {new Date(t.fecha).toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' })}</p>}
                  {(t.hora_inicio && t.hora_fin) ? (
                    <p className="text-sm"><strong>🕐 Horario:</strong> {t.hora_inicio} - {t.hora_fin}</p>
                  ) : (
                    <p className="text-sm"><strong>🕐 Horario:</strong> Por definir</p>
                  )}
                  <p className="text-sm"><strong>👥 Cupo:</strong> {t.cupo}</p>
                  {t.costo && parseFloat(t.costo) > 0 && (
                    <p className="text-sm font-semibold text-green-700">💰 Costo: Q{parseFloat(t.costo).toFixed(2)}</p>
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
                    {inscrito ? 'Ya inscrito' : (t.costo && parseFloat(t.costo) > 0 ? '💳 Pagar e Inscribirse' : 'Inscribirme')}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

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
                  {c.fecha && <p className="text-sm"><strong>📅 Fecha:</strong> {new Date(c.fecha).toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' })}</p>}
                  {(c.hora_inicio && c.hora_fin) ? (
                    <p className="text-sm"><strong>🕐 Horario:</strong> {c.hora_inicio} - {c.hora_fin}</p>
                  ) : (
                    <p className="text-sm"><strong>🕐 Horario:</strong> Por definir</p>
                  )}
                  <p className="text-sm"><strong>👥 Cupo:</strong> {c.cupo}</p>
                  {c.costo && parseFloat(c.costo) > 0 && (
                    <p className="text-sm font-semibold text-green-700">💰 Costo: Q{parseFloat(c.costo).toFixed(2)}</p>
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
                    {inscrito ? 'Ya inscrito' : (c.costo && parseFloat(c.costo) > 0 ? '💳 Pagar e Inscribirse' : 'Inscribirme')}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <FormularioInscripcionModal
        isOpen={isModalOpen}
        onClose={cerrarModal}
        onSubmit={handleInscripcion}
        actividad={actividadSeleccionada}
        tipoActividad={tipoActividadSeleccionada}
        usuario={user}
      />
    </div>
  );
}
