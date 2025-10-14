'use client';

import { useEffect, useState, useRef } from 'react';
import QRCode from 'react-qr-code';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export default function Participantes() {
  const [lista, setLista] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQrFor, setShowQrFor] = useState(null);
  const [showInscripcionesFor, setShowInscripcionesFor] = useState(null);
  const debounceRef = useRef(null);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  // 🔄 Cargar participantes con inscripciones incluidas
  const cargarParticipantes = async (filtro = '') => {
    try {
      setLoading(true);
      const url = filtro
        ? `/api/participantes?busqueda=${encodeURIComponent(filtro)}`
        : '/api/participantes';
      const res = await fetch(url);
      const data = await res.json();
      
      // Validar que la respuesta sea un array
      if (Array.isArray(data)) {
        setLista(data);
      } else {
        console.error('La respuesta de la API no es un array:', data);
        setLista([]);
      }
    } catch (error) {
      console.error('Error al obtener participantes:', error);
      setLista([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarParticipantes();
  }, []);

  const toggleInscripciones = (participanteId) => {
    if (showInscripcionesFor === participanteId) {
      setShowInscripcionesFor(null);
    } else {
      setShowInscripcionesFor(participanteId);
    }
  };

  // 🧠 Búsqueda con debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      cargarParticipantes(busqueda.trim());
    }, 400);
  }, [busqueda]);

  // 📤 Exportar a Excel
  const exportarExcel = () => {
    if (lista.length === 0) {
      alert('No hay datos para exportar.');
      return;
    }

    // Crear datos planos para Excel
    const datosExcel = lista.map(p => ({
      ID: p.id,
      Nombre: p.nombre,
      Correo: p.correo,
      Colegio: p.colegio || 'N/A',
      Teléfono: p.telefono || 'N/A',
      Carnet: p.carnet || 'N/A',
      Tipo: p.tipo,
      'Talleres Inscritos': p.talleres?.length || 0,
      'Competencias Inscritas': p.competencias?.length || 0,
      'Total Inscripciones': (p.talleres?.length || 0) + (p.competencias?.length || 0)
    }));

    // Crear hoja de cálculo
    const ws = XLSX.utils.json_to_sheet(datosExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Participantes');

    // Aplicar formato básico
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
      if (ws[cellAddress]) {
        ws[cellAddress].s = {
          fill: { fgColor: { rgb: '1E90FF' } },
          font: { color: { rgb: 'FFFFFF' }, bold: true },
          alignment: { horizontal: 'center' },
        };
      }
    }

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([excelBuffer]), 'Participantes.xlsx');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 p-4">
      <h1 className="text-3xl font-bold text-center text-gray-800">
        Participantes Registrados
      </h1>

      {/* 🔍 Buscador */}
      <div className="flex flex-col sm:flex-row justify-center items-center gap-2">
        <input
          type="text"
          placeholder="Buscar por nombre, correo, teléfono o colegio..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={exportarExcel}
          disabled={lista.length === 0}
          className={`px-4 py-2 rounded-lg transition ${
            lista.length === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          📤 Exportar Excel
        </button>
      </div>

      {/* Estado de carga */}
      {loading && (
        <p className="text-center text-gray-500 mt-4">Cargando participantes...</p>
      )}

      {/* Resumen */}
      {!loading && lista.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
          <p className="text-sm text-blue-800">
            <strong>{lista.length}</strong> participante{lista.length !== 1 ? 's' : ''} encontrado{lista.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* Lista de participantes */}
      {!loading && lista.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-500 text-lg">
            {busqueda.trim() 
              ? 'No se encontraron participantes con esos criterios de búsqueda.' 
              : 'No hay participantes registrados.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-3 mt-4">
          {lista.map((p) => (
            <li
              key={p.id}
              className="bg-white p-4 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-800">
                    {p.nombre}
                    <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {p.tipo === 'interno' ? 'Interno' : 'Externo'}
                    </span>
                  </h3>
                  <p className="text-gray-600 text-sm">{p.correo}</p>
                  {p.tipo === 'externo' && p.colegio && (
                    <p className="text-gray-500 text-sm">🏫 {p.colegio}</p>
                  )}
                  {p.telefono && (
                    <p className="text-gray-500 text-sm">📱 {p.telefono}</p>
                  )}
                  {p.carnet && (
                    <p className="text-gray-500 text-sm">🎓 Carnet: {p.carnet}</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => toggleInscripciones(p.id)}
                    className="inline-flex items-center px-3 py-1.5 bg-purple-500 text-white font-medium rounded-md shadow-sm hover:bg-purple-600 transition-colors text-sm"
                  >
                    {showInscripcionesFor === p.id ? '✕' : '📋'} Inscripciones
                  </button>
                  <button
                    onClick={() => setShowQrFor(showQrFor === p.id ? null : p.id)}
                    className="inline-flex items-center px-3 py-1.5 bg-blue-500 text-white font-medium rounded-md shadow-sm hover:bg-blue-600 transition-colors text-sm"
                  >
                    {showQrFor === p.id ? '✕' : '📱'} QR
                  </button>
                </div>
              </div>

              {/* Panel de inscripciones */}
              {showInscripcionesFor === p.id && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-700 mb-3">Inscripciones:</h4>
                  
                  <div className="space-y-4">
                    {/* Talleres */}
                    <div>
                      <p className="font-medium text-blue-700 mb-2">
                        📚 Talleres ({p.talleres?.length || 0})
                      </p>
                      {!p.talleres || p.talleres.length === 0 ? (
                        <p className="text-gray-500 text-sm ml-4">No inscrito en talleres</p>
                      ) : (
                        <ul className="ml-4 space-y-1">
                          {p.talleres.map((t) => (
                            <li key={t.id} className="text-sm">
                              <span className="font-medium">{t.nombre}</span>
                              {t.fecha && (
                                <span className="text-gray-600 ml-2">
                                  📅 {new Date(t.fecha).toLocaleDateString('es-GT')}
                                </span>
                              )}
                              {t.horario && (
                                <span className="text-gray-600 ml-2">
                                  🕐 {t.horario}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Competencias */}
                    <div>
                      <p className="font-medium text-indigo-700 mb-2">
                        🏆 Competencias ({p.competencias?.length || 0})
                      </p>
                      {!p.competencias || p.competencias.length === 0 ? (
                        <p className="text-gray-500 text-sm ml-4">No inscrito en competencias</p>
                      ) : (
                        <ul className="ml-4 space-y-1">
                          {p.competencias.map((c) => (
                            <li key={c.id} className="text-sm">
                              <span className="font-medium">{c.nombre}</span>
                              {c.fecha && (
                                <span className="text-gray-600 ml-2">
                                  📅 {new Date(c.fecha).toLocaleDateString('es-GT')}
                                </span>
                              )}
                              {c.horario && (
                                <span className="text-gray-600 ml-2">
                                  🕐 {c.horario}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Total */}
                    <div className="pt-2 border-t border-gray-300">
                      <p className="text-sm font-medium text-gray-700">
                        Total inscripciones: {(p.talleres?.length || 0) + (p.competencias?.length || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Código QR */}
              {showQrFor === p.id && (
                <div className="flex justify-center mt-4 p-4 bg-white rounded-lg border border-gray-200">
                  <div className="text-center">
                    <QRCode
                      value={`${origin}/asistencia?pid=${p.id}`}
                      size={160}
                    />
                    <p className="text-xs text-gray-500 mt-2">ID: {p.id}</p>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
