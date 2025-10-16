'use client';
import { useEffect, useState } from 'react';

export default function ResultadosAdmin() {
  const [competencias, setCompetencias] = useState([]);
  const [inscritos, setInscritos] = useState({});
  const [ganadores, setGanadores] = useState({});
  const [resultadosActuales, setResultadosActuales] = useState({});
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState({});

  // Cargar competencias y resultados actuales
  useEffect(() => {
    async function fetchData() {
      try {
        // Cargar competencias
        const resComp = await fetch('/api/competencias', { cache: 'no-store' });
        if (!resComp.ok) throw new Error(`HTTP ${resComp.status}`);
        const dataComp = await resComp.json();
        setCompetencias(Array.isArray(dataComp) ? dataComp : []);

        // Cargar resultados del año actual
        const anioActual = new Date().getFullYear();
        const resResultados = await fetch(`/api/resultados?anio=${anioActual}`, { cache: 'no-store' });
        if (resResultados.ok) {
          const dataResultados = await resResultados.json();
          // Organizar por competencia_id y puesto
          const resultadosMap = {};
          dataResultados.forEach(r => {
            if (!resultadosMap[r.competencia_id]) {
              resultadosMap[r.competencia_id] = {};
            }
            resultadosMap[r.competencia_id][r.puesto] = r.usuario_id;
          });
          setResultadosActuales(resultadosMap);
          setGanadores(resultadosMap);
        }
      } catch (err) {
        console.error('Error cargando datos:', err);
        setError('No se pudieron cargar los datos.');
      }
    }
    fetchData();
  }, []);

  // Cargar inscritos de una competencia
  async function verInscritos(competenciaId) {
    try {
      setError('');
      setCargando(prev => ({ ...prev, [competenciaId]: true }));
      const url = `/api/inscripciones-competencias?competencia_id=${competenciaId}`;
      const res = await fetch(url, { cache: 'no-store' });

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await res.text();
        console.error('Respuesta no JSON:', text.slice(0, 200));
        throw new Error('La API no devolvió JSON.');
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      setInscritos(prev => ({ ...prev, [competenciaId]: Array.isArray(data) ? data : [] }));
    } catch (err) {
      console.error('Error cargando inscritos:', err);
      setError('No se pudieron cargar los inscritos de la competencia.');
    } finally {
      setCargando(prev => ({ ...prev, [competenciaId]: false }));
    }
  }

  // Guardar ganador (1°, 2° o 3°)
  async function guardarGanador(competenciaId, puesto) {
    const usuarioId = ganadores[competenciaId]?.[puesto];
    if (!usuarioId) {
      setError(`Debe seleccionar un participante para el puesto ${puesto}`);
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      setCargando(prev => ({ ...prev, [`guardar-${competenciaId}-${puesto}`]: true }));
      const body = {
        competencia_id: competenciaId,
        puesto,
        usuario_id: usuarioId,
        anio: new Date().getFullYear(),
      };

      console.log('Enviando datos:', body);

      const res = await fetch('/api/resultados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      let errorMessage = 'Error al guardar resultado';
      
      try {
        const data = await res.json();
        if (!res.ok) {
          errorMessage = data.error || errorMessage;
          console.error('Error del servidor:', data);
          throw new Error(errorMessage);
        }

        const accion = data.updated ? 'actualizado' : 'guardado';
        setMensaje(`Resultado del puesto ${puesto} ${accion} correctamente ✅`);
        setTimeout(() => setMensaje(''), 4000);

        // Actualizar estado local
        setResultadosActuales(prev => ({
          ...prev,
          [competenciaId]: {
            ...(prev[competenciaId] || {}),
            [puesto]: usuarioId
          }
        }));
      } catch (parseError) {
        if (!res.ok) {
          // Si no pudimos parsear el JSON pero sabemos que hubo error
          const text = await res.text();
          console.error('Respuesta del servidor (no JSON):', text);
          throw new Error(`Error del servidor (${res.status}): ${text.substring(0, 100)}`);
        }
        throw parseError;
      }
    } catch (err) {
      console.error('Error completo al guardar resultado:', err);
      setError(err.message || 'Error al guardar resultado');
      setTimeout(() => setError(''), 6000);
    } finally {
      setCargando(prev => ({ ...prev, [`guardar-${competenciaId}-${puesto}`]: false }));
    }
  }

  function manejarCambio(competenciaId, puesto, usuarioId) {
    setGanadores(prev => {
      const ganadoresComp = prev[competenciaId] || {};
      
      // Verificar si este usuario ya está asignado a otro puesto
      const puestoActual = Object.entries(ganadoresComp).find(
        ([p, uid]) => uid === usuarioId && parseInt(p) !== puesto
      );
      
      // Si el usuario ya está en otro puesto, primero lo removemos de allí
      const nuevosGanadores = { ...ganadoresComp };
      if (puestoActual) {
        delete nuevosGanadores[puestoActual[0]];
      }
      
      // Asignamos el usuario al nuevo puesto
      nuevosGanadores[puesto] = usuarioId;
      
      return {
        ...prev,
        [competenciaId]: nuevosGanadores,
      };
    });
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Gestión de Resultados de Competencias</h1>

      {mensaje && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
          </svg>
          {mensaje}
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
          </svg>
          {error}
        </div>
      )}

      {competencias.length === 0 ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">Cargando competencias...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {competencias.map(c => {
            const lista = inscritos[c.id] || [];
            const mostrarInscritos = lista.length > 0;
            const tienePrimero = resultadosActuales[c.id]?.[1];
            const tieneSegundo = resultadosActuales[c.id]?.[2];
            const tieneTercero = resultadosActuales[c.id]?.[3];

            return (
              <div key={c.id} className="border rounded-lg shadow-md bg-white overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-bold">{c.nombre}</h2>
                      <p className="text-sm text-blue-100 mt-1">
                        {c.inscritos || 0} inscrito(s) • {c.fecha ? new Date(c.fecha).toLocaleDateString('es-GT') : 'Fecha por definir'}
                      </p>
                    </div>
                    <button
                      onClick={() => verInscritos(c.id)}
                      disabled={cargando[c.id]}
                      className="px-4 py-2 bg-white text-blue-700 font-semibold rounded-lg hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {cargando[c.id] ? 'Cargando...' : mostrarInscritos ? 'Actualizar' : 'Ver Inscritos'}
                    </button>
                  </div>
                </div>

                <div className="p-4">
                  {/* Indicadores de ganadores actuales */}
                  {(tienePrimero || tieneSegundo || tieneTercero) && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm font-semibold text-yellow-800 mb-2">🏆 Ganadores registrados:</p>
                      <div className="flex gap-3 text-xs">
                        {tienePrimero && <span className="px-2 py-1 bg-yellow-400 text-yellow-900 rounded">1° Puesto ✓</span>}
                        {tieneSegundo && <span className="px-2 py-1 bg-gray-300 text-gray-900 rounded">2° Puesto ✓</span>}
                        {tieneTercero && <span className="px-2 py-1 bg-orange-300 text-orange-900 rounded">3° Puesto ✓</span>}
                      </div>
                    </div>
                  )}

                  {mostrarInscritos ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 border-b-2 border-gray-200">
                          <tr>
                            <th className="px-3 py-3 text-left font-semibold text-gray-700">Participante</th>
                            <th className="px-3 py-3 text-left font-semibold text-gray-700">Colegio</th>
                            <th className="px-3 py-3 text-left font-semibold text-gray-700">Correo</th>
                            <th className="px-3 py-3 text-center font-semibold text-gray-700">
                              <div className="flex flex-col items-center">
                                <span className="text-yellow-600">🥇</span>
                                <span className="text-xs">1° Puesto</span>
                              </div>
                            </th>
                            <th className="px-3 py-3 text-center font-semibold text-gray-700">
                              <div className="flex flex-col items-center">
                                <span className="text-gray-500">🥈</span>
                                <span className="text-xs">2° Puesto</span>
                              </div>
                            </th>
                            <th className="px-3 py-3 text-center font-semibold text-gray-700">
                              <div className="flex flex-col items-center">
                                <span className="text-orange-600">🥉</span>
                                <span className="text-xs">3° Puesto</span>
                              </div>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {lista.map((p) => (
                            <tr key={`insc-${p.id}`} className="hover:bg-gray-50 transition">
                              <td className="px-3 py-3 font-medium text-gray-900">{p.nombre}</td>
                              <td className="px-3 py-3 text-gray-600">{p.colegio || '—'}</td>
                              <td className="px-3 py-3 text-gray-600 text-xs">{p.correo || '—'}</td>
                              {[1, 2, 3].map(puesto => {
                                const estaSeleccionado = ganadores[c.id]?.[puesto] === p.usuario_id;
                                
                                return (
                                  <td key={puesto} className="px-3 py-3 text-center">
                                    <input
                                      type="radio"
                                      name={`puesto-${c.id}-${puesto}`}
                                      checked={estaSeleccionado}
                                      onChange={() => manejarCambio(c.id, puesto, p.usuario_id)}
                                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    />
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Botones para guardar */}
                      <div className="mt-4 flex gap-3 justify-end">
                        {[1, 2, 3].map(puesto => {
                          const cargandoBtn = cargando[`guardar-${c.id}-${puesto}`];
                          const seleccionado = ganadores[c.id]?.[puesto];
                          const puestoTexto = puesto === 1 ? '1er' : puesto === 2 ? '2do' : '3er';
                          const colorBtn = puesto === 1 ? 'bg-yellow-500 hover:bg-yellow-600' 
                                         : puesto === 2 ? 'bg-gray-500 hover:bg-gray-600'
                                         : 'bg-orange-500 hover:bg-orange-600';

                          return (
                            <button
                              key={puesto}
                              onClick={() => guardarGanador(c.id, puesto)}
                              disabled={!seleccionado || cargandoBtn}
                              className={`px-4 py-2 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${colorBtn}`}
                            >
                              {cargandoBtn ? 'Guardando...' : `Guardar ${puestoTexto} Puesto`}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">
                      Haz clic en "Ver Inscritos" para gestionar los ganadores
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
