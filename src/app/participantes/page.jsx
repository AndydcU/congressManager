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
  const [inscripciones, setInscripciones] = useState({ talleres: [], competencias: [] });
  const [loadingInscripciones, setLoadingInscripciones] = useState(false);
  const debounceRef = useRef(null);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  // 🔄 Cargar participantes
  const cargarParticipantes = async (filtro = '') => {
    try {
      setLoading(true);
      const url = filtro
        ? `/api/participantes?busqueda=${encodeURIComponent(filtro)}`
        : '/api/participantes';
      const res = await fetch(url);
      const data = await res.json();
      setLista(data);
    } catch (error) {
      console.error('Error al obtener participantes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarParticipantes();
  }, []);

  // 📋 Cargar inscripciones de un participante
  const cargarInscripciones = async (participanteId) => {
    try {
      setLoadingInscripciones(true);
      const [tRes, cRes] = await Promise.all([
        fetch(`/api/inscripciones?participante_id=${participanteId}`),
        fetch(`/api/inscripciones-competencias?participante_id=${participanteId}`)
      ]);
      const tData = await tRes.json();
      const cData = await cRes.json();
      setInscripciones({
        talleres: Array.isArray(tData) ? tData : [],
        competencias: Array.isArray(cData) ? cData : []
      });
    } catch (error) {
      console.error('Error al cargar inscripciones:', error);
      setInscripciones({ talleres: [], competencias: [] });
    } finally {
      setLoadingInscripciones(false);
    }
  };

  const toggleInscripciones = (participanteId) => {
    if (showInscripcionesFor === participanteId) {
      setShowInscripcionesFor(null);
    } else {
      setShowInscripcionesFor(participanteId);
      cargarInscripciones(participanteId);
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

    // Crear hoja de cálculo
    const ws = XLSX.utils.json_to_sheet(lista);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Participantes');

    // Aplicar formato básico
    const encabezados = Object.keys(lista[0]);
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
      ws[cellAddress].s = {
        fill: { fgColor: { rgb: '1E90FF' } },
        font: { color: { rgb: 'FFFFFF' }, bold: true },
        alignment: { horizontal: 'center' },
      };
    }

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([excelBuffer]), 'Participantes.xlsx');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 p-4">
      <h1 className="text-3xl font-bold text-center text-gray-800">
        Participantes
      </h1>

      {/* 🔍 Buscador */}
      <div className="flex justify-center items-center gap-2">
        <input
          type="text"
          placeholder="Buscar por nombre, correo, teléfono o colegio..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={exportarExcel}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          📤 Exportar Participantes Inscritos
        </button>
      </div>

      {/* Estado de carga */}
      {loading && (
        <p className="text-center text-gray-500 mt-4">Buscando...</p>
      )}

      {/* Lista */}
      <ul className="space-y-3 mt-4">
        {lista.length === 0 && !loading ? (
          <p className="text-center text-gray-500">
            No se encontraron participantes.
          </p>
        ) : (
          lista.map((p) => (
            <li
              key={p.id}
              className="bg-white p-4 rounded-lg shadow flex flex-col"
            >
              <div className="flex justify-between items-center">
                <span className="font-medium">
                  {p.tipo === 'externo'
                    ? `${p.nombre} — ${p.colegio} — ${p.telefono}`
                    : 'Interno'}
                </span>

                <div className="flex gap-2">
                  <button
                    onClick={() => toggleInscripciones(p.id)}
                    className="inline-flex items-center px-3 py-1 bg-purple-500 text-white font-medium rounded-md shadow-sm hover:bg-purple-600 transition-colors text-sm"
                  >
                    {showInscripcionesFor === p.id ? 'Ocultar' : '📋 Inscripciones'}
                  </button>
                  <button
                    onClick={() =>
                      setShowQrFor(showQrFor === p.id ? null : p.id)
                    }
                    className="inline-flex items-center px-3 py-1 bg-blue-500 text-white font-medium rounded-md shadow-sm hover:bg-blue-600 transition-colors text-sm"
                  >
                    {showQrFor === p.id ? 'Ocultar QR' : 'Ver QR'}
                  </button>
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-2">{p.correo}</p>

              {showInscripcionesFor === p.id && (
                <div className="mt-3 p-3 bg-gray-50 rounded border">
                  <h4 className="font-semibold mb-2">Inscripciones:</h4>
                  {loadingInscripciones ? (
                    <p className="text-sm text-gray-500">Cargando...</p>
                  ) : (
                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="font-medium text-blue-700">📚 Talleres ({inscripciones.talleres.length}):</p>
                        {inscripciones.talleres.length === 0 ? (
                          <p className="text-gray-500 ml-4">No inscrito en talleres</p>
                        ) : (
                          <ul className="ml-4 list-disc">
                            {inscripciones.talleres.map((t, i) => (
                              <li key={i}>{t.nombre}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-indigo-700">🏆 Competencias ({inscripciones.competencias.length}):</p>
                        {inscripciones.competencias.length === 0 ? (
                          <p className="text-gray-500 ml-4">No inscrito en competencias</p>
                        ) : (
                          <ul className="ml-4 list-disc">
                            {inscripciones.competencias.map((c, i) => (
                              <li key={i}>{c.nombre}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {showQrFor === p.id && (
                <div className="flex justify-center mt-2">
                  <QRCode
                    value={`${origin}/asistencia?pid=${p.id}`}
                    size={128}
                  />
                </div>
              )}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
