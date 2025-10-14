'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function MisDiplomasPage() {
  const [user, setUser] = useState(null);
  const [participanteId, setParticipanteId] = useState(null);
  const [diplomas, setDiplomas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generandoDiploma, setGenerandoDiploma] = useState(null);
  const [enviandoDiploma, setEnviandoDiploma] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  const canvasRef = useRef(null);
  const router = useRouter();

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
      const pid = parseInt(storedPid);
      setParticipanteId(pid);
      fetchDiplomas(pid);
    } else {
      setLoading(false);
    }
  }, [router]);

  const fetchDiplomas = async (pid) => {
    try {
      const res = await fetch(`/api/diplomas?participante_id=${pid}`);
      const data = await res.json();
      setDiplomas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error cargando diplomas:', error);
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
          participante_id: participanteId,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMensaje({
          tipo: 'success',
          texto: `✅ Diploma enviado exitosamente a ${user.correo}`,
        });
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
      // Ocultar mensaje después de 5 segundos
      setTimeout(() => setMensaje(null), 5000);
    }
  };

  const generarDiploma = async (diploma) => {
    setGenerandoDiploma(diploma.id);
    
    // Create canvas for diploma
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = 1200;
    canvas.height = 850;
    
    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#1e3a8a');
    gradient.addColorStop(1, '#3b82f6');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Border
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 20;
    ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
    
    // Inner border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 5;
    ctx.strokeRect(60, 60, canvas.width - 120, canvas.height - 120);
    
    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 60px serif';
    ctx.textAlign = 'center';
    ctx.fillText('CERTIFICADO DE PARTICIPACIÓN', canvas.width / 2, 180);
    
    // Subtitle
    ctx.font = 'italic 30px serif';
    ctx.fillText('Se otorga a:', canvas.width / 2, 280);
    
    // Participant name
    ctx.font = 'bold 50px serif';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(user.nombre.toUpperCase(), canvas.width / 2, 360);
    
    // Text
    ctx.fillStyle = '#ffffff';
    ctx.font = '28px serif';
    ctx.fillText('Por su participación en', canvas.width / 2, 440);
    
    // Activity name
    ctx.font = 'bold 38px serif';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(diploma.actividad_nombre, canvas.width / 2, 500);
    
    // Type
    ctx.fillStyle = '#ffffff';
    ctx.font = 'italic 24px serif';
    ctx.fillText(`(${diploma.tipo})`, canvas.width / 2, 545);
    
    // Date
    ctx.font = '22px serif';
    const fecha = new Date(diploma.fecha_emision).toLocaleDateString('es-GT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    ctx.fillText(`Emitido el ${fecha}`, canvas.width / 2, 650);
    
    // Footer
    ctx.font = 'italic 20px serif';
    ctx.fillText('Congreso de Tecnología', canvas.width / 2, 750);
    
    // Download
    setTimeout(() => {
      const link = document.createElement('a');
      link.download = `diploma-${diploma.actividad_nombre.replace(/\s+/g, '-')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      setGenerandoDiploma(null);
    }, 500);
  };

  if (!user) return <p className="text-center mt-10">Verificando sesión...</p>;
  if (loading) return <p className="text-center mt-10">Cargando diplomas...</p>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <header className="text-center">
        <h1 className="text-4xl font-bold mb-2">🎓 Mis Diplomas</h1>
        <p className="text-gray-600">Visualiza y descarga tus certificados de participación</p>
      </header>

      {mensaje && (
        <div
          className={`p-4 rounded-lg ${
            mensaje.tipo === 'success'
              ? 'bg-green-100 text-green-800 border border-green-200'
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}
        >
          {mensaje.texto}
        </div>
      )}

      {diplomas.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
          <p className="text-yellow-800 text-lg mb-2">📋 Aún no tienes diplomas disponibles</p>
          <p className="text-gray-600 text-sm">
            Los diplomas se generan automáticamente al completar talleres y competencias.
            <br />
            Asegúrate de registrar tu asistencia en cada sesión.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {diplomas.map((diploma) => (
            <div
              key={diploma.id}
              className="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-blue-100 hover:shadow-xl transition-shadow"
            >
              <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-4 text-white">
                <h3 className="font-bold text-lg">{diploma.actividad_nombre}</h3>
                <p className="text-sm opacity-90">{diploma.tipo}</p>
              </div>
              
              <div className="p-4 space-y-3">
                <div className="text-sm text-gray-600">
                  <p><strong>Fecha de emisión:</strong></p>
                  <p>{new Date(diploma.fecha_emision).toLocaleDateString('es-GT', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</p>
                </div>
                
                {diploma.asistencias_requeridas && (
                  <div className="text-sm text-gray-600">
                    <p><strong>Asistencias completadas:</strong></p>
                    <p>{diploma.asistencias_completadas} / {diploma.asistencias_requeridas}</p>
                  </div>
                )}
                
                <button
                  onClick={() => generarDiploma(diploma)}
                  disabled={generandoDiploma === diploma.id}
                  className={`w-full py-2 rounded-lg font-semibold transition-colors ${
                    generandoDiploma === diploma.id
                      ? 'bg-gray-300 text-gray-600 cursor-wait'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {generandoDiploma === diploma.id ? '⏳ Generando...' : '📥 Descargar Diploma'}
                </button>
                
                <button
                  onClick={() => enviarDiplomaPorCorreo(diploma)}
                  disabled={enviandoDiploma === diploma.id}
                  className={`w-full py-2 rounded-lg font-semibold transition-colors ${
                    enviandoDiploma === diploma.id
                      ? 'bg-gray-300 text-gray-600 cursor-wait'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {enviandoDiploma === diploma.id ? '📧 Enviando...' : '📧 Enviar por Correo'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Hidden canvas for diploma generation */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}
