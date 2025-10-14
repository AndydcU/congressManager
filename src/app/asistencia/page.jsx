'use client';

import { useState, useEffect } from 'react';
import QrScanner from '@/components/QrScanner';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export default function AsistenciaPage() {
  const [escaneando, setEscaneando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [ultimoId, setUltimoId] = useState(null);
  const [asistencias, setAsistencias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // 🔄 Cargar asistencias
  const cargarAsistencias = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/asistencia');
      const data = await res.json();
      setAsistencias(data);
    } catch (error) {
      console.error('Error al obtener asistencias:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarAsistencias();
    const interval = setInterval(cargarAsistencias, 15000);
    return () => clearInterval(interval);
  }, []);

  // ✅ Escaneo de QR
  const handleScan = async (data) => {
    if (!data) return;
    
    let usuario_id = null;
    let tipo = null;
    let id = null;
    let timestamp = null;
    
    try {
      // El QR debe tener formato: {"usuario_id":3,"tipo":"taller","id":2,"timestamp":1760482774376}
      const jsonData = JSON.parse(data);
      usuario_id = jsonData.usuario_id;
      tipo = jsonData.tipo; // 'taller' or 'competencia'
      id = jsonData.id; // taller_id or competencia_id
      timestamp = jsonData.timestamp;
    } catch (jsonError) {
      setMensaje('⚠️ Código QR inválido. No se pudo identificar el participante.');
      console.log('Error parseando QR:', data);
      return;
    }
    
    if (!usuario_id || !tipo || !id) {
      setMensaje('⚠️ Código QR inválido. No se pudo identificar el participante.');
      console.log('Datos del QR:', data);
      return;
    }
    
    // Evitar escaneos duplicados rápidos
    const scanKey = `${usuario_id}-${tipo}-${id}`;
    if (scanKey === ultimoId) return;
    setUltimoId(scanKey);
    setMensaje('Registrando asistencia...');

    try {
      const res = await fetch('/api/asistencia/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id, tipo, id, timestamp }),
      });

      const resultado = await res.json();

      if (res.ok) {
        setMensaje(resultado.mensaje || '✅ Asistencia registrada exitosamente.');
        await cargarAsistencias();
      } else {
        setMensaje(`❌ ${resultado.error || 'No se pudo registrar.'}`);
      }
    } catch (error) {
      console.error('Error en registro:', error);
      setMensaje('❌ Error al registrar asistencia.');
    }
  };

  // 📤 Exportar asistencias a Excel
  const exportarExcel = () => {
    if (asistencias.length === 0) {
      alert('No hay asistencias para exportar.');
      return;
    }

    const datos = asistencias.map((a) => ({
      ID: a.id,
      Participante: a.nombre,
      'Tipo Participante': a.tipo_participante || '—',
      Actividad: a.actividad || '—',
      'Tipo Actividad': a.tipo_actividad || '—',
      Fecha: new Date(a.registrado_en).toLocaleString('es-GT', {
        dateStyle: 'short',
        timeStyle: 'short',
      }),
    }));

    const ws = XLSX.utils.json_to_sheet(datos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Asistencias');

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([excelBuffer]), 'Asistencias.xlsx');
  };

  // Filtrar asistencias por búsqueda
  const filteredAsistencias = asistencias.filter((a) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      a.nombre?.toLowerCase().includes(term) ||
      a.actividad?.toLowerCase().includes(term) ||
      a.tipo_actividad?.toLowerCase().includes(term)
    );
  });

  return (
    <main className="min-h-screen flex flex-col items-center justify-start p-6 bg-gray-50">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 text-center">
        Registro de Asistencia
      </h1>

      <div className="flex gap-3 mb-4">
        <button
          onClick={() => setEscaneando(!escaneando)}
          className={`px-6 py-3 rounded-lg text-white shadow transition ${
            escaneando
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {escaneando ? '✖️ Detener cámara' : '📷 Escanear asistencia'}
        </button>

        <button
          onClick={exportarExcel}
          className="px-6 py-3 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition"
        >
          📤 Exportar Asistencias
        </button>
      </div>

      {escaneando && (
        <div className="mt-2 w-full max-w-md bg-white p-4 rounded-lg shadow">
          <QrScanner onScan={handleScan} />
        </div>
      )}

      {mensaje && (
        <p className="mt-4 text-center text-gray-800 font-medium">{mensaje}</p>
      )}

      {/* Tabla de asistencias */}
      <div className="mt-10 w-full max-w-5xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-700">
            Asistencias recientes ({filteredAsistencias.length})
          </h2>
          {/* Buscador */}
          <input
            type="text"
            placeholder="🔍 Buscar por nombre o actividad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {loading ? (
          <p className="text-center text-gray-500">Cargando...</p>
        ) : asistencias.length === 0 ? (
          <p className="text-center text-gray-500">
            Aún no hay registros de asistencia.
          </p>
        ) : filteredAsistencias.length === 0 ? (
          <p className="text-center text-gray-500">
            No se encontraron resultados para "{searchTerm}".
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-300 shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-200 text-gray-800">
                <tr>
                  <th className="px-4 py-2 text-left">Nombre</th>
                  <th className="px-4 py-2 text-left">Tipo Part.</th>
                  <th className="px-4 py-2 text-left">Actividad</th>
                  <th className="px-4 py-2 text-left">Tipo Act.</th>
                  <th className="px-4 py-2 text-left">Fecha / Hora</th>
                </tr>
              </thead>
              <tbody>
                {filteredAsistencias.map((a, i) => (
                  <tr key={i} className="border-t hover:bg-gray-100">
                    <td className="px-4 py-2 font-medium">{a.nombre}</td>
                    <td className="px-4 py-2">{a.tipo_participante || '—'}</td>
                    <td className="px-4 py-2">{a.actividad || 'General'}</td>
                    <td className="px-4 py-2">
                      {a.tipo_actividad === 'taller' ? '📚 Taller' : 
                       a.tipo_actividad === 'competencia' ? '🏆 Competencia' : '—'}
                    </td>
                    <td className="px-4 py-2">
                      {new Date(a.registrado_en).toLocaleString('es-GT', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
