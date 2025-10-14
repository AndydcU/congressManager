'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';

export default function MiPerfilPage() {
  const [user, setUser] = useState(null);
  const [perfilCompleto, setPerfilCompleto] = useState(null);
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
    
    // Cargar el perfil completo con inscripciones
    fetchPerfilCompleto(parsed.id);
  }, [router]);

  const generateQR = async (userId, tipo, id) => {
    try {
      const qrData = JSON.stringify({ 
        usuario_id: userId, 
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

  const fetchPerfilCompleto = async (userId) => {
    try {
      const res = await fetch(`/api/usuarios/${userId}`);
      if (!res.ok) {
        throw new Error('Error al obtener perfil');
      }
      const data = await res.json();
      
      // Generar códigos QR para cada inscripción
      const talleresWithQR = await Promise.all(
        (data.talleres || []).map(async (t) => ({
          ...t,
          qrCode: await generateQR(userId, 'taller', t.taller_id)
        }))
      );
      
      const competenciasWithQR = await Promise.all(
        (data.competencias || []).map(async (c) => ({
          ...c,
          qrCode: await generateQR(userId, 'competencia', c.competencia_id)
        }))
      );
      
      setPerfilCompleto({
        ...data,
        talleres: talleresWithQR,
        competencias: competenciasWithQR
      });
    } catch (error) {
      console.error('Error cargando perfil completo:', error);
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

  const formatearFecha = (fecha) => {
    if (!fecha) return 'Sin fecha';
    try {
      return new Date(fecha).toLocaleDateString('es-GT', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  if (!user) return <p className="text-center mt-10">Verificando sesión...</p>;
  if (loading) return <p className="text-center mt-10">Cargando perfil...</p>;
  if (!perfilCompleto) return <p className="text-center mt-10">Error al cargar perfil</p>;

  const misTalleres = perfilCompleto.talleres || [];
  const misCompetencias = perfilCompleto.competencias || [];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <header className="text-center">
        <h1 className="text-4xl font-bold mb-2">Mi Perfil</h1>
        <p className="text-gray-600">Bienvenido, <strong>{user.nombre}</strong></p>
      </header>

      {/* Información del Usuario */}
      <section className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">Información Personal</h2>
        <div className="space-y-2 text-sm">
          <p><strong>ID:</strong> #{perfilCompleto.id}</p>
          <p><strong>Nombre:</strong> {perfilCompleto.nombre}</p>
          <p><strong>Correo:</strong> {perfilCompleto.correo}</p>
          <p><strong>Tipo:</strong> {perfilCompleto.tipo_usuario === 'interno' ? 'Alumno Interno' : 'Alumno Externo'}</p>
          {perfilCompleto.carnet && <p><strong>Carnet:</strong> {perfilCompleto.carnet}</p>}
          {perfilCompleto.grado && <p><strong>Grado:</strong> {perfilCompleto.grado}</p>}
          {perfilCompleto.colegio && <p><strong>Colegio:</strong> {perfilCompleto.colegio}</p>}
          {perfilCompleto.telefono && <p><strong>Teléfono:</strong> {perfilCompleto.telefono}</p>}
        </div>
      </section>

      {/* Resumen de Inscripciones */}
      <section className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-4 text-center">Resumen de Inscripciones</h2>
        <div className="grid md:grid-cols-2 gap-4 text-center">
          <div className="bg-white rounded-lg p-4 shadow">
            <p className="text-3xl font-bold text-blue-600">{misTalleres.length}</p>
            <p className="text-gray-600">Talleres</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <p className="text-3xl font-bold text-indigo-600">{misCompetencias.length}</p>
            <p className="text-gray-600">Competencias</p>
          </div>
        </div>
      </section>

      {/* Mis Inscripciones */}
      <section className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-6">Mis Inscripciones</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Talleres */}
          <div>
            <h3 className="font-semibold text-lg mb-3 text-blue-900 flex items-center gap-2">
              📚 Talleres ({misTalleres.length})
            </h3>
            {misTalleres.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <p className="text-gray-500 text-sm">No estás inscrito en ningún taller</p>
                <p className="text-xs text-gray-400 mt-2">Visita la sección de talleres para inscribirte</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {misTalleres.map((t) => (
                  <li key={t.id} className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-600 hover:shadow-md transition-shadow">
                    <p className="font-semibold text-blue-900">{t.nombre}</p>
                    <p className="text-xs text-gray-600 mt-1">📅 {formatearFecha(t.fecha)}</p>
                    {t.horario && <p className="text-xs text-gray-600">🕐 {t.horario}</p>}
                    <p className="text-xs text-gray-500 mt-1">
                      Estado: <span className={`font-medium ${t.estado === 'confirmada' ? 'text-green-600' : 'text-yellow-600'}`}>
                        {t.estado || 'Pendiente'}
                      </span>
                    </p>
                    {t.qrCode && (
                      <div className="mt-3 flex items-center gap-3 pt-3 border-t border-blue-200">
                        <img 
                          src={t.qrCode} 
                          alt={`QR ${t.nombre}`} 
                          className="w-24 h-24 border-2 border-blue-300 rounded bg-white p-1" 
                        />
                        <button
                          onClick={() => downloadQR(t.qrCode, t.nombre, 'taller')}
                          className="px-3 py-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors shadow"
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

          {/* Competencias */}
          <div>
            <h3 className="font-semibold text-lg mb-3 text-indigo-900 flex items-center gap-2">
              🏆 Competencias ({misCompetencias.length})
            </h3>
            {misCompetencias.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <p className="text-gray-500 text-sm">No estás inscrito en ninguna competencia</p>
                <p className="text-xs text-gray-400 mt-2">Visita la sección de competencias para inscribirte</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {misCompetencias.map((c) => (
                  <li key={c.id} className="p-4 bg-indigo-50 rounded-lg border-l-4 border-indigo-600 hover:shadow-md transition-shadow">
                    <p className="font-semibold text-indigo-900">{c.nombre}</p>
                    <p className="text-xs text-gray-600 mt-1">📅 {formatearFecha(c.fecha)}</p>
                    {c.horario && <p className="text-xs text-gray-600">🕐 {c.horario}</p>}
                    <p className="text-xs text-gray-500 mt-1">
                      Estado: <span className={`font-medium ${c.estado === 'confirmada' ? 'text-green-600' : 'text-yellow-600'}`}>
                        {c.estado || 'Pendiente'}
                      </span>
                    </p>
                    {c.qrCode && (
                      <div className="mt-3 flex items-center gap-3 pt-3 border-t border-indigo-200">
                        <img 
                          src={c.qrCode} 
                          alt={`QR ${c.nombre}`} 
                          className="w-24 h-24 border-2 border-indigo-300 rounded bg-white p-1" 
                        />
                        <button
                          onClick={() => downloadQR(c.qrCode, c.nombre, 'competencia')}
                          className="px-3 py-2 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors shadow"
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

      {/* Nota sobre códigos QR */}
      {(misTalleres.length > 0 || misCompetencias.length > 0) && (
        <section className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
            💡 Importante
          </h3>
          <p className="text-sm text-yellow-700">
            Cada taller y competencia tiene su propio código QR. Asegúrate de presentar el código correspondiente 
            al registrar tu asistencia en cada actividad.
          </p>
        </section>
      )}
    </div>
  );
}
