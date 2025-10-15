'use client';
import { useState } from 'react';

export default function DiplomasAdminPage() {
  const [generando, setGenerando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  const generarDiplomas = async (tipo) => {
    setGenerando(true);
    setMensaje(null);
    setResultado(null);

    try {
      const res = await fetch('/api/diplomas/generar-automaticos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo }),
      });

      const data = await res.json();

      if (res.ok) {
        setResultado(data);
        setMensaje({
          tipo: 'success',
          texto: `✅ Se generaron ${data.generados} diploma(s) exitosamente`,
        });
      } else {
        setMensaje({
          tipo: 'error',
          texto: data.error || 'Error al generar diplomas',
        });
      }
    } catch (error) {
      setMensaje({
        tipo: 'error',
        texto: 'Error de conexión al generar diplomas',
      });
    } finally {
      setGenerando(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-8">
      <header className="text-center space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          🎓 Generación de Diplomas
        </h1>
        <p className="text-gray-600">Panel administrativo para generar diplomas automáticamente</p>
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

      <div className="grid md:grid-cols-3 gap-6">
        {/* Diplomas por Asistencia */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-blue-200">
          <div className="text-center mb-4">
            <div className="text-5xl mb-3">📋</div>
            <h3 className="text-xl font-bold text-gray-800">Diplomas por Asistencia</h3>
            <p className="text-sm text-gray-600 mt-2">
              Genera diplomas para usuarios que asistieron a talleres y competencias finalizados
            </p>
          </div>
          <button
            onClick={() => generarDiplomas('asistencia')}
            disabled={generando}
            className={`w-full py-3 rounded-lg font-semibold transition ${
              generando
                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {generando ? '⏳ Generando...' : '🚀 Generar Diplomas'}
          </button>
        </div>

        {/* Diplomas para Ganadores */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-yellow-200">
          <div className="text-center mb-4">
            <div className="text-5xl mb-3">🏆</div>
            <h3 className="text-xl font-bold text-gray-800">Diplomas para Ganadores</h3>
            <p className="text-sm text-gray-600 mt-2">
              Genera diplomas especiales para ganadores de competencias (1°, 2°, 3° lugar)
            </p>
          </div>
          <button
            onClick={() => generarDiplomas('ganadores')}
            disabled={generando}
            className={`w-full py-3 rounded-lg font-semibold transition ${
              generando
                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                : 'bg-yellow-500 text-white hover:bg-yellow-600'
            }`}
          >
            {generando ? '⏳ Generando...' : '🥇 Generar Diplomas'}
          </button>
        </div>

        {/* Todos los Diplomas */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-200">
          <div className="text-center mb-4">
            <div className="text-5xl mb-3">⚡</div>
            <h3 className="text-xl font-bold text-gray-800">Generar Todos</h3>
            <p className="text-sm text-gray-600 mt-2">
              Genera todos los diplomas pendientes de asistencias y ganadores en una sola operación
            </p>
          </div>
          <button
            onClick={() => generarDiplomas('all')}
            disabled={generando}
            className={`w-full py-3 rounded-lg font-semibold transition ${
              generando
                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            {generando ? '⏳ Generando...' : '🎯 Generar Todos'}
          </button>
        </div>
      </div>

      {/* Información */}
      <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
        <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
          <span>ℹ️</span>
          <span>Información del Sistema</span>
        </h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p><strong>• Sistema Automático:</strong> Los diplomas se generan automáticamente para:</p>
          <ul className="ml-6 space-y-1">
            <li>- Usuarios con asistencia registrada en talleres/competencias finalizados</li>
            <li>- Ganadores de competencias (1°, 2°, 3° lugar del año actual)</li>
          </ul>
          <p className="mt-3"><strong>• Prevención de Duplicados:</strong> El sistema verifica que no existan diplomas previos antes de generar</p>
          <p><strong>• Código de Verificación:</strong> Cada diploma tiene un código único para validar autenticidad</p>
          <p><strong>• Notificación:</strong> Los diplomas pueden ser enviados por correo desde el perfil del usuario</p>
        </div>
      </div>

      {/* Resultados */}
      {resultado && (
        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-green-200">
          <h3 className="font-bold text-green-900 mb-4 flex items-center gap-2">
            <span>📊</span>
            <span>Resultados de la Generación</span>
          </h3>
          
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-3xl font-bold text-green-600">{resultado.generados}</div>
              <div className="text-sm text-green-800">Diplomas Generados</div>
            </div>
            {resultado.errores && (
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-3xl font-bold text-red-600">{resultado.errores.length}</div>
                <div className="text-sm text-red-800">Errores</div>
              </div>
            )}
          </div>

          {resultado.diplomas && resultado.diplomas.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold text-gray-800 mb-2">Diplomas Creados:</h4>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {resultado.diplomas.map((d, idx) => (
                  <div key={idx} className="bg-gray-50 p-3 rounded border border-gray-200 text-sm">
                    <div className="font-semibold text-gray-800">{d.usuario_nombre}</div>
                    <div className="text-gray-600">
                      {d.tipo.charAt(0).toUpperCase() + d.tipo.slice(1)} • 
                      Código: <code className="text-blue-600 text-xs">{d.codigo_verificacion}</code>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {resultado.errores && resultado.errores.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold text-red-800 mb-2">Errores encontrados:</h4>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {resultado.errores.map((err, idx) => (
                  <div key={idx} className="bg-red-50 p-2 rounded text-xs text-red-700">
                    {err.usuario || err.tipo}: {err.error}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
