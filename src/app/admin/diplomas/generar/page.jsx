'use client';
import { useState } from 'react';

export default function GenerarDiplomasPage() {
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');

  async function generarDiplomas() {
    setCargando(true);
    setError('');
    setResultado(null);

    try {
      const response = await fetch('/api/diplomas/generar-ganadores', {
        method: 'POST'
      });

      const data = await response.json();

      if (data.success) {
        setResultado(data);
      } else {
        setError(data.error || 'Error al generar diplomas');
      }
    } catch (err) {
      setError('Error de conexión: ' + err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Generar Diplomas de Ganadores</h1>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h2 className="font-semibold text-blue-900 mb-2">ℹ️ Información</h2>
        <p className="text-blue-800 text-sm">
          Este botón genera diplomas para todos los ganadores (1°, 2° y 3° lugar) que aún no tengan su diploma de reconocimiento.
          Los diplomas se almacenan en Vercel Blob Storage y se registran en la base de datos.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <button
          onClick={generarDiplomas}
          disabled={cargando}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {cargando ? (
            <>
              <span className="inline-block animate-spin mr-2">⏳</span>
              Generando diplomas...
            </>
          ) : (
            <>
              🏆 Generar Diplomas de Ganadores
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-red-900 mb-2">❌ Error</h3>
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {resultado && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-900 mb-3">
            ✅ Diplomas Generados: {resultado.generados}
          </h3>
          
          {resultado.diplomas && resultado.diplomas.length > 0 && (
            <div className="space-y-3">
              {resultado.diplomas.map((diploma, index) => (
                <div key={index} className="bg-white rounded p-3 border border-green-100">
                  <p className="font-semibold text-gray-900">{diploma.usuario_nombre}</p>
                  <p className="text-sm text-gray-600">Código: {diploma.codigo_verificacion}</p>
                  <a 
                    href={diploma.archivo_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline mt-1 inline-block"
                  >
                    📄 Ver diploma →
                  </a>
                </div>
              ))}
            </div>
          )}

          {resultado.errores && resultado.errores.length > 0 && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded p-3">
              <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Errores en algunos diplomas:</h4>
              {resultado.errores.map((err, index) => (
                <p key={index} className="text-sm text-yellow-800">
                  • {err.usuario}: {err.error}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
