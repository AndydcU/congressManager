'use client';
import { useEffect, useState } from 'react';

export default function ResultadosAdmin() {
  const [competencias, setCompetencias] = useState([]);
  const [inscritos, setInscritos] = useState({});
  const [ganadores, setGanadores] = useState({});
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  // Cargar competencias
  useEffect(() => {
    async function fetchCompetencias() {
      try {
        const res = await fetch('/api/competencias', { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setCompetencias(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error cargando competencias:', err);
        setError('No se pudieron cargar las competencias.');
      }
    }
    fetchCompetencias();
  }, []);

  // Cargar inscritos de una competencia
  async function verInscritos(competenciaId) {
    try {
      setError('');
      const url = `/api/inscripciones-competencias?competencia_id=${competenciaId}`;
      const res = await fetch(url, { cache: 'no-store' });

      // Si no es JSON, probablemente es un 404 con HTML
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await res.text();
        console.error('Respuesta no JSON:', text.slice(0, 200));
        throw new Error('La API no devolvió JSON (¿ruta inexistente?).');
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      setInscritos(prev => ({ ...prev, [competenciaId]: Array.isArray(data) ? data : [] }));
    } catch (err) {
      console.error('Error cargando inscritos:', err);
      setError('No se pudieron cargar los inscritos de la competencia.');
    }
  }

  // Guardar ganador (1°, 2° o 3°)
  async function guardarGanador(competenciaId, puesto) {
    const participanteId = ganadores[competenciaId]?.[puesto];
    if (!participanteId) {
      alert(`Debe seleccionar un participante para el puesto ${puesto}`);
      return;
    }

    try {
      const body = {
        competencia_id: competenciaId,
        puesto,
        participante_id: participanteId,
        anio: new Date().getFullYear(),
      };

      const res = await fetch('/api/resultados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Error al guardar resultado');

      setMensaje('Resultado guardado correctamente ✅');
      setTimeout(() => setMensaje(''), 3000);
    } catch (err) {
      console.error('Error al guardar resultado:', err);
      alert('Error al guardar resultado');
    }
  }

  function manejarCambio(competenciaId, puesto, participanteId) {
    setGanadores(prev => ({
      ...prev,
      [competenciaId]: {
        ...(prev[competenciaId] || {}),
        [puesto]: participanteId,
      },
    }));
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-6">Gestión de Resultados de Competencias</h1>

      {mensaje && <p className="mb-4 p-2 bg-green-100 text-green-700 rounded">{mensaje}</p>}
      {error && <p className="mb-4 p-2 bg-red-100 text-red-700 rounded">{error}</p>}

      {competencias.length === 0 ? (
        <p className="text-gray-500">Cargando competencias...</p>
      ) : (
        competencias.map(c => {
          const lista = inscritos[c.id] || [];
          return (
            <div key={c.id} className="mb-8 border rounded-lg shadow p-4 bg-white">
              <div className="flex justify-between items-center mb-1">
                <h2 className="text-lg font-semibold">{c.nombre}</h2>
                <button
                  onClick={() => verInscritos(c.id)}
                  className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded"
                >
                  Ver Inscritos
                </button>
              </div>
              <p className="text-sm text-gray-500 mb-3">
                {lista.length > 0 ? `${lista.length} inscrito(s)` : 'No hay inscritos aún.'}
              </p>

              {lista.length > 0 && (
                <table className="min-w-full text-sm border rounded">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-2 text-left">Participante</th>
                      <th className="p-2 text-left">Colegio</th>
                      <th className="p-2 text-left">Correo</th>
                      <th className="p-2 text-left">Teléfono</th>
                      <th className="p-2 text-center">1°</th>
                      <th className="p-2 text-center">2°</th>
                      <th className="p-2 text-center">3°</th>
                      <th className="p-2 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lista.map((p, idx) => (
                      <tr key={`insc-${p.id}-${p.participante_id}-${idx}`} className="border-t">
                        <td className="p-2">{p.nombre}</td>
                        <td className="p-2">{p.colegio || '—'}</td>
                        <td className="p-2">{p.correo || '—'}</td>
                        <td className="p-2">{p.telefono || '—'}</td>
                        {[1, 2, 3].map(puesto => (
                          <td key={puesto} className="p-2 text-center">
                            <input
                              type="radio"
                              name={`puesto-${c.id}-${puesto}`}
                              checked={ganadores[c.id]?.[puesto] === p.participante_id}
                              onChange={() => manejarCambio(c.id, puesto, p.participante_id)}
                            />
                          </td>
                        ))}
                        <td className="p-2 text-center">
                          <button
                            onClick={() => guardarGanador(c.id, 1)}
                            className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded"
                          >
                            Guardar 1°
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
