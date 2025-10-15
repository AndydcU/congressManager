'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function MisDiplomasPage() {
  const [user, setUser] = useState(null);
  const [diplomas, setDiplomas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enviandoDiploma, setEnviandoDiploma] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    const parsed = JSON.parse(storedUser);
    setUser(parsed);
    fetchDiplomas(parsed.id);
  }, [router]);

  const fetchDiplomas = async (userId) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/diplomas?usuario_id=${userId}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Error al cargar diplomas');
      const data = await res.json();
      setDiplomas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error cargando diplomas:', error);
      setMensaje({ tipo: 'error', texto: 'Error al cargar diplomas' });
    } finally {
      setLoading(false);
    }
  };

  const enviarDiplomaPorCorreo = async (diploma) => {
    setEnviandoDiploma(diploma.id);
    setMensaje(null);

    try {
      const res = await fetch('/api/diplomas/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diploma_id: diploma.id,
          usuario_id: user.id,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMensaje({
          tipo: 'success',
          texto: `✅ Diploma enviado exitosamente a ${user.correo}`,
        });
        // Actualizar lista de diplomas
        fetchDiplomas(user.id);
      } else {
        setMensaje({
          tipo: 'error',
          texto: data.error || 'Error al enviar el diploma',
        });
      }
    } catch (error) {
      setMensaje({
        tipo: 'error',
        texto: 'Error de conexión al enviar el diploma',
      });
    } finally {
      setEnviandoDiploma(null);
      setTimeout(() => setMensaje(null), 5000);
    }
  };

  const descargarDiploma = (diploma) => {
    window.open(diploma.archivo_url, '_blank');
  };

  if (!user) return <p className="text-center mt-10">Verificando sesión...</p>;
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">Cargando diplomas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-8">
      <header className="text-center space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          🎓 Mis Diplomas
        </h1>
        <p className="text-gray-600">Visualiza, descarga y comparte tus certificados de participación</p>
      </header>

      {mensaje && (
        <div
          className={`p-4 rounded-lg flex items-center gap-3 ${
            mensaje.tipo === 'success'
              ? 'bg-green-100 text-green-800 border-2 border-green-200'
              : 'bg-red-100 text-red-800 border-2 border-red-200'
          }`}
        >
          <span className="text-2xl">{mensaje.tipo === 'success' ? '✅' : '⚠️'}</span>
          <span>{mensaje.texto}</span>
        </div>
      )}

      {diplomas.length === 0 ? (
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-12 text-center">
          <div className="text-6xl mb-4">📋</div>
          <p className="text-blue-900 text-xl font-semibold mb-2">
            Aún no tienes diplomas disponibles
          </p>
          <p className="text-gray-600 max-w-md mx-auto">
            Los diplomas se generan automáticamente cuando:
          </p>
          <ul className="text-left max-w-md mx-auto mt-4 space-y-2 text-gray-700">
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>Completas tu asistencia a un taller</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>Participas en una competencia</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>Ganas un lugar en una competencia</span>
            </li>
          </ul>
          <p className="text-sm text-gray-500 mt-6">
            Recuerda registrar tu asistencia en cada sesión usando tu código QR
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {diplomas.map((diploma) => {
            // Detectar si es ganador y qué puesto
            let puestoTexto = null;
            let esGanador = false;
            
            if (diploma.codigo_verificacion) {
              if (diploma.codigo_verificacion.includes('PRIMERLUGAR')) {
                esGanador = true;
                puestoTexto = 'PRIMER LUGAR';
              } else if (diploma.codigo_verificacion.includes('SEGUNDOLUGAR')) {
                esGanador = true;
                puestoTexto = 'SEGUNDO LUGAR';
              } else if (diploma.codigo_verificacion.includes('TERCERLUGAR')) {
                esGanador = true;
                puestoTexto = 'TERCER LUGAR';
              }
            }
            
            return (
              <div
                key={diploma.id}
                className={`bg-white rounded-xl shadow-lg overflow-hidden border-2 transition-all hover:shadow-2xl hover:scale-105 ${
                  esGanador ? 'border-yellow-400' : 'border-blue-100'
                }`}
              >
                {esGanador && puestoTexto && (
                  <div className={`text-white text-center py-2 font-bold text-sm ${
                    puestoTexto === 'PRIMER LUGAR' ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                    puestoTexto === 'SEGUNDO LUGAR' ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-900' :
                    'bg-gradient-to-r from-orange-400 to-orange-600'
                  }`}>
                    {puestoTexto === 'PRIMER LUGAR' ? '🥇' : puestoTexto === 'SEGUNDO LUGAR' ? '🥈' : '🥉'} DIPLOMA DE GANADOR DE {puestoTexto}
                  </div>
                )}
                
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-4 text-white">
                  <h3 className="font-bold text-lg line-clamp-2">{diploma.actividad_nombre}</h3>
                  <p className="text-sm opacity-90 mt-1">
                    {diploma.tipo.charAt(0).toUpperCase() + diploma.tipo.slice(1)}
                  </p>
                </div>
                
                <div className="p-4 space-y-3">
                  <div className="text-sm text-gray-600 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">📅 Fecha de emisión:</span>
                      <span>{new Date(diploma.emitido_en).toLocaleDateString('es-GT', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}</span>
                    </div>
                    
                    {diploma.codigo_verificacion && (
                      <div className="bg-gray-100 p-2 rounded text-xs">
                        <span className="font-semibold">🔐 Código:</span>
                        <code className="ml-1 text-blue-600">{diploma.codigo_verificacion}</code>
                      </div>
                    )}

                    {diploma.enviado ? (
                      <div className="flex items-center gap-2 text-green-600 text-xs">
                        <span>✓</span>
                        <span>Enviado el {new Date(diploma.enviado_en).toLocaleDateString('es-GT')}</span>
                      </div>
                    ) : null}
                  </div>
                  
                  <div className="space-y-2 pt-2">
                    <button
                      onClick={() => descargarDiploma(diploma)}
                      className="w-full py-2.5 rounded-lg font-semibold transition-colors bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center gap-2"
                    >
                      <span>📥</span>
                      <span>Descargar Diploma</span>
                    </button>
                    
                    <button
                      onClick={() => enviarDiplomaPorCorreo(diploma)}
                      disabled={enviandoDiploma === diploma.id}
                      className={`w-full py-2.5 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
                        enviandoDiploma === diploma.id
                          ? 'bg-gray-300 text-gray-600 cursor-wait'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      <span>{enviandoDiploma === diploma.id ? '⏳' : '📧'}</span>
                      <span>{enviandoDiploma === diploma.id ? 'Enviando...' : 'Enviar por Correo'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {diplomas.length > 0 && (
        <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <span>ℹ️</span>
            <span>Información Importante</span>
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Puedes descargar tus diplomas en formato PDF</li>
            <li>• El código de verificación permite validar la autenticidad del diploma</li>
            <li>• Los diplomas se generan automáticamente al finalizar cada actividad</li>
            <li>• Los diplomas de ganadores tienen un diseño especial</li>
          </ul>
        </div>
      )}
    </div>
  );
}
