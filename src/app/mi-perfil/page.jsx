'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';

export default function MiPerfilPage() {
  const [user, setUser] = useState(null);
  const [participanteId, setParticipanteId] = useState(null);
  const [misTalleres, setMisTalleres] = useState([]);
  const [misCompetencias, setMisCompetencias] = useState([]);
  const [loading, setLoading] = useState(true);
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
      fetchInscripciones(pid);
    } else {
      setLoading(false);
    }
  }, [router]);

  const generateQR = async (pid, tipo, id) => {
    try {
      const qrData = JSON.stringify({ 
        participante_id: pid, 
        tipo: tipo, // 'taller' or 'competencia'
        id: id, // taller_id or competencia_id
        timestamp: Date.now() 
      });
      return await QRCode.toDataURL(qrData, { width: 300 });
    } catch (error) {
      console.error('Error generando QR:', error);
      return null;
    }
  };

  const fetchInscripciones = async (pid) => {
    try {
      const [tRes, cRes] = await Promise.all([
        fetch(`/api/inscripciones?participante_id=${pid}`),
        fetch(`/api/inscripciones-competencias?participante_id=${pid}`)
      ]);
      const tData = await tRes.json();
      const cData = await cRes.json();
      
      // Generate QR codes for each enrollment
      const talleresWithQR = await Promise.all(
        (Array.isArray(tData) ? tData : []).map(async (t) => ({
          ...t,
          qrCode: await generateQR(pid, 'taller', t.id)
        }))
      );
      
      const competenciasWithQR = await Promise.all(
        (Array.isArray(cData) ? cData : []).map(async (c) => ({
          ...c,
          qrCode: await generateQR(pid, 'competencia', c.id)
        }))
      );
      
      setMisTalleres(talleresWithQR);
      setMisCompetencias(competenciasWithQR);
    } catch (error) {
      console.error('Error cargando inscripciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = (qrCode, nombre, tipo) => {
    const link = document.createElement('a');
    link.href = qrCode;
    link.download = `qr-${tipo}-${nombre.replace(/\s+/g, '-')}.png`;
    link.click();
  };

  if (!user) return <p className="text-center mt-10">Verificando sesión...</p>;
  if (loading) return <p className="text-center mt-10">Cargando perfil...</p>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <header className="text-center">
        <h1 className="text-4xl font-bold mb-2">Mi Perfil</h1>
        <p className="text-gray-600">Bienvenido, <strong>{user.nombre}</strong></p>
      </header>

      {/* QR Codes Information */}
      {participanteId && (
        <section className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 text-center">Códigos QR de Asistencia</h2>
          <p className="text-center text-gray-600 mb-6">
            Cada taller y competencia tiene su propio código QR. Presenta el código correspondiente al registrar tu asistencia.
          </p>
          <p className="text-sm text-gray-500 text-center">
            ID de Participante: <strong>#{participanteId}</strong>
          </p>
        </section>
      )}

      {/* Mis Inscripciones */}
      <section className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">Mis Inscripciones</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-lg mb-3 text-blue-900">
              📚 Talleres ({misTalleres.length})
            </h3>
            {misTalleres.length === 0 ? (
              <p className="text-gray-500 text-sm">No estás inscrito en ningún taller</p>
            ) : (
              <ul className="space-y-3">
                {misTalleres.map((t) => (
                  <li key={t.id} className="p-3 bg-blue-50 rounded border-l-4 border-blue-600">
                    <p className="font-semibold">{t.nombre}</p>
                    {t.fecha_realizacion && <p className="text-xs text-gray-600">📅 {new Date(t.fecha_realizacion).toLocaleDateString('es-GT')}</p>}
                    <p className="text-xs text-gray-600">🕐 {t.horario}</p>
                    {t.qrCode && (
                      <div className="mt-2 flex items-center gap-2">
                        <img src={t.qrCode} alt={`QR ${t.nombre}`} className="w-20 h-20 border rounded" />
                        <button
                          onClick={() => downloadQR(t.qrCode, t.nombre, 'taller')}
                          className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          📥 Descargar QR
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-3 text-indigo-900">
              🏆 Competencias ({misCompetencias.length})
            </h3>
            {misCompetencias.length === 0 ? (
              <p className="text-gray-500 text-sm">No estás inscrito en ninguna competencia</p>
            ) : (
              <ul className="space-y-3">
                {misCompetencias.map((c) => (
                  <li key={c.id} className="p-3 bg-indigo-50 rounded border-l-4 border-indigo-600">
                    <p className="font-semibold">{c.nombre}</p>
                    {c.fecha_realizacion && <p className="text-xs text-gray-600">📅 {new Date(c.fecha_realizacion).toLocaleDateString('es-GT')}</p>}
                    <p className="text-xs text-gray-600">🕐 {c.horario}</p>
                    {c.qrCode && (
                      <div className="mt-2 flex items-center gap-2">
                        <img src={c.qrCode} alt={`QR ${c.nombre}`} className="w-20 h-20 border rounded" />
                        <button
                          onClick={() => downloadQR(c.qrCode, c.nombre, 'competencia')}
                          className="px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700"
                        >
                          📥 Descargar QR
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* Información del Usuario */}
      <section className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">Información Personal</h2>
        <div className="space-y-2 text-sm">
          <p><strong>Nombre:</strong> {user.nombre}</p>
          <p><strong>Correo:</strong> {user.correo}</p>
          {user.colegio && <p><strong>Colegio:</strong> {user.colegio}</p>}
          {user.telefono && <p><strong>Teléfono:</strong> {user.telefono}</p>}
        </div>
      </section>
    </div>
  );
}
