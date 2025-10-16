'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import Link from 'next/link';

export default function MiPerfilPage() {
  const [user, setUser] = useState(null);
  const [perfilCompleto, setPerfilCompleto] = useState(null);
  const [diplomas, setDiplomas] = useState([]);
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
    
    // Cargar el perfil completo con inscripciones y diplomas
    fetchPerfilCompleto(parsed.id);
    fetchDiplomas(parsed.id);
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

  const fetchDiplomas = async (userId) => {
    try {
      const res = await fetch(`/api/diplomas?usuario_id=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setDiplomas(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error cargando diplomas:', error);
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

  const actividadFinalizada = (fecha, horaFin) => {
    if (!fecha || !horaFin) return false;
    
    try {
      const ahora = new Date();
      
      // Parsear la fecha correctamente (la fecha viene en formato YYYY-MM-DD desde MySQL)
      const [year, month, day] = fecha.split('T')[0].split('-');
      const [horas, minutos] = horaFin.split(':');
      
      // Crear fecha local sin problemas de zona horaria
      const fechaActividad = new Date(
        parseInt(year), 
        parseInt(month) - 1, // Los meses en JS van de 0-11
        parseInt(day),
        parseInt(horas),
        parseInt(minutos),
        0
      );
      
      return ahora > fechaActividad;
    } catch (error) {
      console.error('Error al comparar fechas:', error);
      return false;
    }
  };

  const separarActividades = (actividades) => {
    const actuales = [];
    const pasadas = [];
    
    actividades.forEach(act => {
      if (actividadFinalizada(act.fecha, act.hora_fin)) {
        pasadas.push(act);
      } else {
        actuales.push(act);
      }
    });
    
    return { actuales, pasadas };
  };

  if (!user) return <p className="text-center mt-10">Verificando sesión...</p>;
  if (loading) return <p className="text-center mt-10">Cargando perfil...</p>;
  if (!perfilCompleto) return <p className="text-center mt-10">Error al cargar perfil</p>;

  const { actuales: talleresActuales, pasadas: talleresPasados } = separarActividades(perfilCompleto.talleres || []);
  const { actuales: competenciasActuales, pasadas: competenciasPasadas } = separarActividades(perfilCompleto.competencias || []);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <header className="text-center">
        <h1 className="text-4xl font-bold mb-2">Mi Perfil</h1>
        <p className="text-gray-600">Bienvenido, <strong>{user.nombre}</strong></p>
      </header>

      {/* Información del Usuario */}
      <section className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">Información Personal</h2>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="mb-2"><strong className="text-gray-700">ID:</strong> #{perfilCompleto.id}</p>
            <p className="mb-2"><strong className="text-gray-700">Nombre:</strong> {perfilCompleto.nombre}</p>
            <p className="mb-2"><strong className="text-gray-700">Correo:</strong> {perfilCompleto.correo}</p>
            <p className="mb-2"><strong className="text-gray-700">Tipo:</strong> {perfilCompleto.tipo_usuario === 'interno' ? 'Alumno Interno' : 'Alumno Externo'}</p>
          </div>
          <div>
            {perfilCompleto.carnet && <p className="mb-2"><strong className="text-gray-700">Carnet:</strong> {perfilCompleto.carnet}</p>}
            {perfilCompleto.grado && <p className="mb-2"><strong className="text-gray-700">Grado:</strong> {perfilCompleto.grado}</p>}
            {perfilCompleto.colegio && <p className="mb-2"><strong className="text-gray-700">Colegio:</strong> {perfilCompleto.colegio}</p>}
            {perfilCompleto.telefono && <p className="mb-2"><strong className="text-gray-700">Teléfono:</strong> {perfilCompleto.telefono}</p>}
          </div>
        </div>
      </section>

      {/* Resumen de Actividades */}
      <section className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-4 text-center">Resumen de Actividades</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="bg-white rounded-lg p-4 shadow">
            <p className="text-3xl font-bold text-blue-600">{talleresActuales.length}</p>
            <p className="text-sm text-gray-600">Talleres Actuales</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <p className="text-3xl font-bold text-indigo-600">{competenciasActuales.length}</p>
            <p className="text-sm text-gray-600">Competencias Actuales</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <p className="text-3xl font-bold text-gray-600">{talleresPasados.length + competenciasPasadas.length}</p>
            <p className="text-sm text-gray-600">Actividades Pasadas</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <p className="text-3xl font-bold text-green-600">{diplomas.length}</p>
            <p className="text-sm text-gray-600">Diplomas Obtenidos</p>
          </div>
        </div>
      </section>

      {/* Actividades Actuales */}
      <section className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">🎯 Actividades Actuales</h2>
          <Link href="/talleresYcompetencias" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            Ver todas →
          </Link>
        </div>
        
        {talleresActuales.length === 0 && competenciasActuales.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-gray-500 text-sm">No tienes actividades próximas</p>
            <Link href="/talleresYcompetencias" className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-block">
              Inscríbete a talleres y competencias
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Talleres Actuales */}
            <div>
              <h3 className="font-semibold text-lg mb-3 text-blue-900 flex items-center gap-2">
                📚 Talleres ({talleresActuales.length})
              </h3>
              {talleresActuales.length === 0 ? (
                <p className="text-gray-500 text-sm">Sin talleres actuales</p>
              ) : (
                <ul className="space-y-3">
                  {talleresActuales.map((t) => (
                    <li key={t.id} className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-600 hover:shadow-md transition-shadow">
                      <p className="font-semibold text-blue-900">{t.nombre}</p>
                      <p className="text-xs text-gray-600 mt-1">📅 {formatearFecha(t.fecha)}</p>
                      {t.horario && <p className="text-xs text-gray-600">🕐 {t.horario}</p>}
                      {t.qrCode && (
                        <div className="mt-3 flex items-center gap-3 pt-3 border-t border-blue-200">
                          <img 
                            src={t.qrCode} 
                            alt={`QR ${t.nombre}`} 
                            className="w-20 h-20 border-2 border-blue-300 rounded bg-white p-1" 
                          />
                          <button
                            onClick={() => downloadQR(t.qrCode, t.nombre, 'taller')}
                            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
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

            {/* Competencias Actuales */}
            <div>
              <h3 className="font-semibold text-lg mb-3 text-indigo-900 flex items-center gap-2">
                🏆 Competencias ({competenciasActuales.length})
              </h3>
              {competenciasActuales.length === 0 ? (
                <p className="text-gray-500 text-sm">Sin competencias actuales</p>
              ) : (
                <ul className="space-y-3">
                  {competenciasActuales.map((c) => (
                    <li key={c.id} className="p-4 bg-indigo-50 rounded-lg border-l-4 border-indigo-600 hover:shadow-md transition-shadow">
                      <p className="font-semibold text-indigo-900">{c.nombre}</p>
                      <p className="text-xs text-gray-600 mt-1">📅 {formatearFecha(c.fecha)}</p>
                      {c.horario && <p className="text-xs text-gray-600">🕐 {c.horario}</p>}
                      {c.qrCode && (
                        <div className="mt-3 flex items-center gap-3 pt-3 border-t border-indigo-200">
                          <img 
                            src={c.qrCode} 
                            alt={`QR ${c.nombre}`} 
                            className="w-20 h-20 border-2 border-indigo-300 rounded bg-white p-1" 
                          />
                          <button
                            onClick={() => downloadQR(c.qrCode, c.nombre, 'competencia')}
                            className="px-3 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
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
        )}
      </section>

      {/* Actividades Pasadas */}
      {(talleresPasados.length > 0 || competenciasPasadas.length > 0) && (
        <section className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-6">📚 Actividades Pasadas</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Talleres Pasados */}
            {talleresPasados.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-3 text-gray-700 flex items-center gap-2">
                  📖 Talleres Finalizados ({talleresPasados.length})
                </h3>
                <ul className="space-y-2">
                  {talleresPasados.map((t) => (
                    <li key={t.id} className="p-3 bg-gray-50 rounded-lg border-l-4 border-gray-400">
                      <p className="font-medium text-gray-800 text-sm">{t.nombre}</p>
                      <p className="text-xs text-gray-500 mt-1">📅 {formatearFecha(t.fecha)}</p>
                      <p className="text-xs text-green-600 mt-1">✓ Participaste en este taller</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Competencias Pasadas */}
            {competenciasPasadas.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-3 text-gray-700 flex items-center gap-2">
                  🏅 Competencias Finalizadas ({competenciasPasadas.length})
                </h3>
                <ul className="space-y-2">
                  {competenciasPasadas.map((c) => (
                    <li key={c.id} className="p-3 bg-gray-50 rounded-lg border-l-4 border-gray-400">
                      <p className="font-medium text-gray-800 text-sm">{c.nombre}</p>
                      <p className="text-xs text-gray-500 mt-1">📅 {formatearFecha(c.fecha)}</p>
                      <p className="text-xs text-green-600 mt-1">✓ Participaste en esta competencia</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Diplomas Disponibles */}
      {diplomas.length > 0 && (
        <section className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg shadow-lg p-6 border border-amber-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              🎓 Mis Diplomas
              <span className="text-sm bg-amber-100 text-amber-800 px-3 py-1 rounded-full">
                {diplomas.length} disponibles
              </span>
            </h2>
            <Link href="/mis-diplomas" className="text-amber-700 hover:text-amber-900 text-sm font-medium">
              Ver todos →
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {diplomas.slice(0, 3).map((diploma) => (
              <div key={diploma.id} className="bg-white p-4 rounded-lg shadow border border-amber-200">
                <p className="font-semibold text-sm text-gray-800 mb-2">
                  {diploma.tipo === 'taller' ? '📚 Taller' : diploma.tipo === 'competencia' ? '🏆 Competencia' : '📜 Asistencia'}
                </p>
                <p className="text-xs text-gray-600 mb-3">
                  Código: {diploma.codigo_verificacion?.substring(0, 20)}...
                </p>
                <a
                  href={diploma.archivo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block w-full text-center px-3 py-2 bg-amber-600 text-white rounded text-sm hover:bg-amber-700 transition"
                >
                  📥 Descargar
                </a>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Nota sobre códigos QR */}
      {(talleresActuales.length > 0 || competenciasActuales.length > 0) && (
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
