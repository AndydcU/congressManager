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

  const getPodiumColor = (puesto) => {
    switch(puesto) {
      case 1: return {
        gradient: 'bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600',
        text: 'text-white',
        shadow: 'shadow-amber-500/50'
      };
      case 2: return {
        gradient: 'bg-gradient-to-br from-slate-300 via-gray-400 to-slate-500',
        text: 'text-gray-900',
        shadow: 'shadow-slate-400/50'
      };
      case 3: return {
        gradient: 'bg-gradient-to-br from-orange-500 via-amber-600 to-orange-700',
        text: 'text-white',
        shadow: 'shadow-orange-500/50'
      };
      default: return {
        gradient: 'bg-gradient-to-br from-blue-500 to-indigo-600',
        text: 'text-white',
        shadow: 'shadow-blue-500/50'
      };
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
      {/* Header Elegante */}
      <header className="text-center space-y-4 py-8">
        <div className="inline-block px-4 py-1.5 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-full text-sm font-semibold shadow-lg">
          Congreso {anioActual}
        </div>
        <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 bg-clip-text text-transparent">
          Resultados de Competencias
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Conoce a los ganadores de este año
        </p>
        <Link 
          href="/resultados/historico" 
          className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-lg hover:from-gray-900 hover:to-black transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
        >
          <span>📅</span>
          Ver histórico de años anteriores
        </Link>
      </header>

      {loading && (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-4 font-medium">Cargando resultados...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-20 bg-red-50 rounded-2xl border-2 border-red-200">
          <div className="text-6xl mb-4">😞</div>
          <p className="text-red-600 font-semibold text-lg">{error}</p>
        </div>
      )}

      {!loading && !error && resultados.length === 0 && (
        <div className="text-center py-20 bg-gradient-to-br from-gray-50 to-slate-100 rounded-2xl border-2 border-gray-200">
          <div className="text-7xl mb-4">🏆</div>
          <p className="text-gray-700 text-xl font-semibold">No hay resultados publicados para este año</p>
          <p className="text-gray-500 mt-2">Los resultados se publicarán una vez finalicen las competencias</p>
        </div>
      )}

      {!loading && !error && Object.keys(porCompetencia).length > 0 && (
        <div className="space-y-16">
          {Object.values(porCompetencia).map((comp, idx) => (
            <section key={idx} className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200">
              {/* Encabezado Elegante con Gradiente */}
              <div className="relative bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 p-8 text-white overflow-hidden">
                <div className="absolute inset-0 bg-black opacity-10"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-center gap-4 mb-2">
                    <span className="text-5xl">🏆</span>
                    <h2 className="text-4xl font-bold">{comp.nombre}</h2>
                  </div>
                  <p className="text-center text-cyan-100 text-lg">Ganadores del año {anioActual}</p>
                </div>
                {/* Decoración */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24"></div>
              </div>

              <div className="p-8">
                {/* Podio Mejorado */}
                {comp.ganadores.some(g => g.puesto === 1) && (
                  <div className="mb-12">
                    <div className="flex items-end justify-center gap-6">
                      {/* 2° Lugar */}
                      {comp.ganadores.find(g => g.puesto === 2) && (
                        <div className="flex flex-col items-center w-1/3">
                          <div className="text-6xl mb-3 animate-bounce">🥈</div>
                          <div className={`${getPodiumColor(2).gradient} ${getPodiumColor(2).text} rounded-2xl p-5 w-full text-center shadow-2xl ${getPodiumColor(2).shadow} transform hover:scale-105 transition-transform`}>
                            <div className="font-bold text-lg mb-2">2° Lugar</div>
                            <div className="text-sm font-semibold">
                              {comp.ganadores.find(g => g.puesto === 2).participante}
                            </div>
                          </div>
                          <div className="bg-slate-400 h-28 w-full rounded-b-2xl shadow-xl"></div>
                        </div>
                      )}

                      {/* 1° Lugar */}
                      <div className="flex flex-col items-center w-1/3 -mt-4">
                        <div className="text-7xl mb-3 animate-bounce">🥇</div>
                        <div className={`${getPodiumColor(1).gradient} ${getPodiumColor(1).text} rounded-2xl p-6 w-full text-center shadow-2xl ${getPodiumColor(1).shadow} transform hover:scale-105 transition-transform ring-4 ring-amber-200`}>
                          <div className="font-bold text-2xl mb-2">1° Lugar</div>
                          <div className="text-base font-semibold">
                            {comp.ganadores.find(g => g.puesto === 1).participante}
                          </div>
                        </div>
                        <div className="bg-amber-500 h-40 w-full rounded-b-2xl shadow-2xl"></div>
                      </div>

                      {/* 3° Lugar */}
                      {comp.ganadores.find(g => g.puesto === 3) && (
                        <div className="flex flex-col items-center w-1/3">
                          <div className="text-6xl mb-3 animate-bounce">🥉</div>
                          <div className={`${getPodiumColor(3).gradient} ${getPodiumColor(3).text} rounded-2xl p-5 w-full text-center shadow-2xl ${getPodiumColor(3).shadow} transform hover:scale-105 transition-transform`}>
                            <div className="font-bold text-lg mb-2">3° Lugar</div>
                            <div className="text-sm font-semibold">
                              {comp.ganadores.find(g => g.puesto === 3).participante}
                            </div>
                          </div>
                          <div className="bg-orange-600 h-24 w-full rounded-b-2xl shadow-xl"></div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tarjetas de Ganadores - Vista Elegante */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                  {comp.ganadores
                    .sort((a, b) => a.puesto - b.puesto)
                    .map((g) => {
                      const colors = getPodiumColor(g.puesto);
                      return (
                        <div 
                          key={g.id} 
                          className="bg-gradient-to-br from-white to-gray-50 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 border-2 border-gray-200"
                        >
                          {g.foto_url && (
                            <div className="relative h-48 overflow-hidden">
                              <img
                                src={g.foto_url}
                                alt={g.proyecto || 'Proyecto'}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                            </div>
                          )}
                          <div className="p-5 space-y-3">
                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold shadow-lg ${colors.gradient} ${colors.text}`}>
                              <span className="text-xl">{getMedallaIcon(g.puesto)}</span>
                              <span>Puesto {g.puesto}</span>
                            </div>
                            
                            {g.participante && (
                              <p className="font-bold text-xl text-gray-900">{g.participante}</p>
                            )}
                            
                            {g.proyecto && (
                              <p className="text-gray-700 font-semibold bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
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
                      );
                    })}
                </div>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
