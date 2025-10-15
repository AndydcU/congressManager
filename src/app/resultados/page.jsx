'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ResultadosPage() {
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const anioActual = new Date().getFullYear();

  useEffect(() => {
    fetchResultados();
  }, []);

  const fetchResultados = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/resultados?anio=${anioActual}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResultados(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('No se pudieron cargar los resultados.');
    } finally {
      setLoading(false);
    }
  };

  // Agrupar por competencia
  const porCompetencia = resultados.reduce((acc, r) => {
    const key = r.competencia_id;
    if (!acc[key]) {
      acc[key] = { nombre: r.competencia, ganadores: [] };
    }
    acc[key].ganadores.push(r);
    return acc;
  }, {});

  const getMedallaIcon = (puesto) => {
    switch(puesto) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '🏅';
    }
  };

  const getMedallaColor = (puesto) => {
    switch(puesto) {
      case 1: return 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white';
      case 2: return 'bg-gradient-to-br from-gray-300 to-gray-500 text-gray-900';
      case 3: return 'bg-gradient-to-br from-orange-400 to-orange-600 text-white';
      default: return 'bg-gradient-to-br from-blue-400 to-blue-600 text-white';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
      <header className="text-center space-y-3 py-6">
        <div className="inline-block px-6 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold mb-2">
          Congreso {anioActual}
        </div>
        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Resultados de Competencias
        </h1>
        <p className="text-xl text-gray-600">Conoce a los ganadores de este año</p>
        <Link 
          href="/resultados/historico" 
          className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-white border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition font-semibold"
        >
          <span>📅</span>
          Ver histórico de años anteriores
        </Link>
      </header>

      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">Cargando resultados...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">😞</div>
          <p className="text-red-600 font-semibold">{error}</p>
        </div>
      )}

      {!loading && !error && resultados.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-6xl mb-4">🏆</div>
          <p className="text-gray-600 text-lg">No hay resultados publicados para este año.</p>
          <p className="text-gray-500 text-sm mt-2">Los resultados se publicarán una vez finalicen las competencias.</p>
        </div>
      )}

      {!loading && !error && Object.keys(porCompetencia).length > 0 && (
        <div className="space-y-12">
          {Object.values(porCompetencia).map((comp, idx) => (
            <section key={idx} className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
                <h2 className="text-3xl font-bold flex items-center gap-3">
                  <span className="text-4xl">🏆</span>
                  {comp.nombre}
                </h2>
                <p className="text-blue-100 mt-2">Ganadores del año {anioActual}</p>
              </div>

              <div className="p-6">
                {/* Podio - Solo si hay al menos primer lugar */}
                {comp.ganadores.some(g => g.puesto === 1) && (
                  <div className="mb-8">
                    <div className="flex items-end justify-center gap-4 mb-6">
                      {/* Segundo lugar */}
                      {comp.ganadores.find(g => g.puesto === 2) && (
                        <div className="flex flex-col items-center w-1/3">
                          <div className="text-5xl mb-2">🥈</div>
                          <div className="bg-gradient-to-br from-gray-300 to-gray-500 text-gray-900 rounded-t-lg p-4 w-full text-center">
                            <div className="font-bold text-lg mb-1">2° Lugar</div>
                            <div className="text-sm font-semibold">
                              {comp.ganadores.find(g => g.puesto === 2).participante}
                            </div>
                            {comp.ganadores.find(g => g.puesto === 2).proyecto && (
                              <div className="text-xs mt-1 opacity-90">
                                {comp.ganadores.find(g => g.puesto === 2).proyecto}
                              </div>
                            )}
                          </div>
                          <div className="bg-gray-400 h-24 w-full rounded-b-lg"></div>
                        </div>
                      )}

                      {/* Primer lugar */}
                      <div className="flex flex-col items-center w-1/3">
                        <div className="text-6xl mb-2">🥇</div>
                        <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 text-white rounded-t-lg p-4 w-full text-center">
                          <div className="font-bold text-xl mb-1">1° Lugar</div>
                          <div className="text-sm font-semibold">
                            {comp.ganadores.find(g => g.puesto === 1).participante}
                          </div>
                          {comp.ganadores.find(g => g.puesto === 1).proyecto && (
                            <div className="text-xs mt-1 opacity-90">
                              {comp.ganadores.find(g => g.puesto === 1).proyecto}
                            </div>
                          )}
                        </div>
                        <div className="bg-yellow-500 h-32 w-full rounded-b-lg"></div>
                      </div>

                      {/* Tercer lugar */}
                      {comp.ganadores.find(g => g.puesto === 3) && (
                        <div className="flex flex-col items-center w-1/3">
                          <div className="text-5xl mb-2">🥉</div>
                          <div className="bg-gradient-to-br from-orange-400 to-orange-600 text-white rounded-t-lg p-4 w-full text-center">
                            <div className="font-bold text-lg mb-1">3° Lugar</div>
                            <div className="text-sm font-semibold">
                              {comp.ganadores.find(g => g.puesto === 3).participante}
                            </div>
                            {comp.ganadores.find(g => g.puesto === 3).proyecto && (
                              <div className="text-xs mt-1 opacity-90">
                                {comp.ganadores.find(g => g.puesto === 3).proyecto}
                              </div>
                            )}
                          </div>
                          <div className="bg-orange-500 h-20 w-full rounded-b-lg"></div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Lista detallada de todos los ganadores */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                  {comp.ganadores
                    .sort((a, b) => a.puesto - b.puesto)
                    .map((g) => (
                      <div 
                        key={g.id} 
                        className={`border-2 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow ${
                          g.puesto <= 3 ? 'border-blue-300' : 'border-gray-200'
                        }`}
                      >
                        {g.foto_url && (
                          <img
                            src={g.foto_url}
                            alt={g.proyecto || 'Proyecto'}
                            className="w-full h-48 object-cover"
                          />
                        )}
                        <div className="p-4 space-y-2">
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold ${getMedallaColor(g.puesto)}`}>
                            <span className="text-xl">{getMedallaIcon(g.puesto)}</span>
                            <span>Puesto {g.puesto}</span>
                          </div>
                          
                          {g.participante && (
                            <p className="font-bold text-lg text-gray-900">{g.participante}</p>
                          )}
                          
                          {g.proyecto && (
                            <p className="text-gray-700 font-semibold border-l-4 border-blue-500 pl-3">
                              {g.proyecto}
                            </p>
                          )}
                          
                          {g.descripcion && (
                            <p className="text-sm text-gray-600 leading-relaxed">
                              {g.descripcion}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
