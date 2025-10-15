'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function PagoContent() {
  const [user, setUser] = useState(null);
  const [participanteId, setParticipanteId] = useState(null);
  const [actividad, setActividad] = useState(null);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [mensaje, setMensaje] = useState(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const tipo = searchParams.get('tipo'); // 'taller' o 'competencia'
  const id = searchParams.get('id');
  const monto = searchParams.get('monto') || '0';

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    const parsed = JSON.parse(storedUser);
    setUser(parsed);
    
    const storedPid = localStorage.getItem('participante_id');
    if (storedPid) {
      setParticipanteId(parseInt(storedPid));
    }
    
    if (tipo && id) {
      fetchActividad();
    } else {
      setLoading(false);
    }
  }, [tipo, id, router]);

  const fetchActividad = async () => {
    try {
      const endpoint = tipo === 'taller' ? '/api/talleres' : '/api/competencias';
      const res = await fetch(endpoint);
      const data = await res.json();
      const encontrada = data.find(a => a.id === parseInt(id));
      setActividad(encontrada);
    } catch (error) {
      console.error('Error cargando actividad:', error);
    } finally {
      setLoading(false);
    }
  };

  const procesarPago = async (e) => {
    e.preventDefault();
    if (!participanteId || !actividad) return;
    
    setProcesando(true);
    setMensaje(null);
    
    try {
      // Registrar el pago
      const pagoRes = await fetch('/api/pagos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participante_id: participanteId,
          actividad_id: actividad.id,
          tipo_actividad: tipo,
          monto: parseFloat(monto),
          metodo_pago: metodoPago
        })
      });
      
      if (!pagoRes.ok) {
        const error = await pagoRes.json();
        throw new Error(error.error || 'Error al procesar el pago');
      }
      
      // Inscribir automáticamente después del pago
      const inscripcionEndpoint = tipo === 'taller' 
        ? '/api/inscripciones' 
        : '/api/inscripciones-competencias';
      
      const inscripcionRes = await fetch(inscripcionEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participante_id: participanteId,
          [tipo === 'taller' ? 'taller_id' : 'competencia_id']: actividad.id
        })
      });
      
      if (!inscripcionRes.ok) {
        throw new Error('Pago procesado pero error al inscribir');
      }
      
      setMensaje({ 
        type: 'success', 
        text: '¡Pago procesado exitosamente! Serás redirigido...' 
      });
      
      setTimeout(() => {
        router.push('/inscripcion');
      }, 2000);
      
    } catch (error) {
      setMensaje({ type: 'error', text: error.message });
    } finally {
      setProcesando(false);
    }
  };

  if (!user) return <p className="text-center mt-10">Verificando sesión...</p>;
  if (loading) return <p className="text-center mt-10">Cargando información...</p>;
  
  if (!tipo || !id || !actividad) {
    return (
      <div className="max-w-2xl mx-auto p-6 mt-10">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 text-lg">Error: Información de pago incompleta</p>
          <button
            onClick={() => router.push('/inscripcion')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Volver a Inscripción
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-6">💳 Procesar Pago</h1>
      
      {mensaje && (
        <div className={`mb-6 p-4 rounded ${mensaje.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {mensaje.text}
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
        {/* Resumen de la actividad */}
        <div className="border-b pb-4">
          <h2 className="text-xl font-semibold mb-3">Resumen de la Actividad</h2>
          <div className="space-y-2 text-gray-700">
            <p><strong>Nombre:</strong> {actividad.nombre}</p>
            <p><strong>Tipo:</strong> {tipo === 'taller' ? 'Taller' : 'Competencia'}</p>
            <p><strong>Descripción:</strong> {actividad.descripcion}</p>
            {actividad.fecha && (
              <p><strong>Fecha:</strong> {new Date(actividad.fecha).toLocaleDateString('es-GT')}</p>
            )}
            <p><strong>Horario:</strong> {actividad.horario}</p>
          </div>
        </div>
        
        {/* Información del pago */}
        <div className="border-b pb-4">
          <h2 className="text-xl font-semibold mb-3">Información del Pago</h2>
          <div className="bg-blue-50 p-4 rounded">
            <p className="text-sm text-gray-600">Monto a pagar:</p>
            <p className="text-3xl font-bold text-blue-900">Q{parseFloat(monto).toFixed(2)}</p>
          </div>
        </div>
        
        {/* Formulario de pago */}
        <form onSubmit={procesarPago} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Método de Pago *</label>
            <select
              value={metodoPago}
              onChange={(e) => setMetodoPago(e.target.value)}
              required
              className="w-full border rounded px-3 py-2"
            >
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia Bancaria</option>
              <option value="tarjeta">Tarjeta de Crédito/Débito</option>
            </select>
          </div>
          
          {/* Instrucciones según método de pago */}
          {metodoPago === 'transferencia' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-4 text-sm">
              <p className="font-semibold mb-2">Instrucciones para Transferencia:</p>
              <p>Banco: Banco Industrial</p>
              <p>Cuenta: 1234567890</p>
              <p>Nombre: Congreso de Tecnología</p>
              <p className="mt-2 text-xs text-gray-600">
                Envía el comprobante a proyectocongresoumg@gmail.com
              </p>
            </div>
          )}
          
          {metodoPago === 'tarjeta' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-4 text-sm">
              <p className="font-semibold mb-2">Nota:</p>
              <p>El pago con tarjeta será procesado en la siguiente pantalla.</p>
              <p className="text-xs text-gray-600 mt-2">
                Sistema seguro de pagos en línea
              </p>
            </div>
          )}
          
          {metodoPago === 'efectivo' && (
            <div className="bg-blue-50 border border-blue-200 rounded p-4 text-sm">
              <p className="font-semibold mb-2">Pago en Efectivo:</p>
              <p>Realiza el pago en la recepción del congreso</p>
              <p className="text-xs text-gray-600 mt-2">
                Horario: Lunes a Viernes de 8:00 AM a 5:00 PM
              </p>
            </div>
          )}
          
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => router.push('/inscripcion')}
              className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              disabled={procesando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={procesando}
              className={`flex-1 px-4 py-2 rounded font-semibold ${
                procesando
                  ? 'bg-gray-300 text-gray-600 cursor-wait'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {procesando ? '⏳ Procesando...' : 'Confirmar Pago'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PagoPage() {
  return (
    <Suspense fallback={<p className="text-center mt-10">Cargando...</p>}>
      <PagoContent />
    </Suspense>
  );
}
