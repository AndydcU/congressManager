'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPanel() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  // Hoy
  const [todaySummary, setTodaySummary] = useState({ fecha: '', total: 0, internos: 0, externos: 0 });
  const [loadingToday, setLoadingToday] = useState(false);
  const [errorToday, setErrorToday] = useState(null);

  // Rango
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [rangeRows, setRangeRows] = useState([]);
  const [loadingRange, setLoadingRange] = useState(false);
  const [errorRange, setErrorRange] = useState(null);

  // Últimos registros
  const [recent, setRecent] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [errorRecent, setErrorRecent] = useState(null);

  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) {
      router.push('/login');
      return;
    }
    const parsed = JSON.parse(stored);
    if (parsed.rol !== 'admin') {
      router.push('/');
      return;
    }
    setUser(parsed);
    setReady(true);
  }, [router]);

  useEffect(() => {
    if (!ready) return;
    fetchToday();
    fetchRecent();
  }, [ready]);

  const fetchToday = async () => {
    setLoadingToday(true);
    setErrorToday(null);
    try {
      const res = await fetch('/api/asistencia/report', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setTodaySummary({
        fecha: data.fecha || new Date().toISOString().slice(0, 10),
        total: data.total || 0,
        internos: data.internos || 0,
        externos: data.externos || 0,
      });
    } catch (err) {
      setErrorToday('No se pudo cargar el resumen de hoy');
    } finally {
      setLoadingToday(false);
    }
  };

  const fetchRange = async () => {
    if (!from || !to) {
      setErrorRange('Debe seleccionar un rango de fechas');
      return;
    }
    setLoadingRange(true);
    setErrorRange(null);
    try {
      const params = new URLSearchParams({ from, to }).toString();
      const res = await fetch(`/api/asistencia/report?${params}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRangeRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setErrorRange('No se pudo cargar el resumen del rango');
    } finally {
      setLoadingRange(false);
    }
  };

  const fetchRecent = async () => {
    setLoadingRecent(true);
    setErrorRecent(null);
    try {
      const res = await fetch('/api/asistencia', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      // Tomar los 50 más recientes
      setRecent(Array.isArray(data) ? data.slice(0, 50) : []);
    } catch (err) {
      setErrorRecent('No se pudo cargar la lista de asistencias');
    } finally {
      setLoadingRecent(false);
    }
  };

  if (!ready) return <p className="text-center mt-10">Verificando acceso...</p>;

  const today = new Date().toISOString().slice(0, 10);
  const csvTodayUrl = `/api/asistencia/export?date=${today}`;
  const csvRangeUrl = from && to ? `/api/asistencia/export?from=${from}&to=${to}` : '#';

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Panel del Administrador</h1>
        <p className="text-gray-600">
          Bienvenido, <strong>{user?.nombre}</strong> ({user?.correo})
        </p>
        <div className="flex flex-wrap gap-3 mt-3">
          <a href="/admin/talleres" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded">Gestionar Talleres y Competencias</a>
          <a href="/participantes" className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded">Ver Participantes</a>
          <a href={csvTodayUrl} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded">Exportar CSV (hoy)</a>
        </div>
      </header>

      {/* Resumen de Hoy */}
      <section className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Resumen de asistencia (hoy)</h2>
        <button onClick={fetchToday} className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded">Refrescar</button>
        </div>
        {loadingToday ? (
          <p className="text-gray-500">Cargando...</p>
        ) : errorToday ? (
          <p className="text-red-600">{errorToday}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="border rounded p-4">
              <p className="text-gray-500">Fecha</p>
              <p className="text-2xl font-bold">{todaySummary.fecha}</p>
            </div>
            <div className="border rounded p-4">
              <p className="text-gray-500">Total</p>
              <p className="text-2xl font-bold">{todaySummary.total}</p>
            </div>
            <div className="border rounded p-4">
              <p className="text-gray-500">Internos/Externos</p>
              <p className="text-2xl font-bold">{todaySummary.internos} / {todaySummary.externos}</p>
            </div>
          </div>
        )}
      </section>

      {/* Resumen por Rango */}
      <section className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Resumen por rango</h2>
          <div className="flex gap-2">
            <a href={csvRangeUrl} className={`px-3 py-1.5 text-sm rounded ${from && to ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>Exportar CSV</a>
            <button onClick={fetchRange} className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded">Generar</button>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 mb-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Desde</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border rounded px-2 py-1" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Hasta</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border rounded px-2 py-1" />
          </div>
        </div>
        {loadingRange ? (
          <p className="text-gray-500">Cargando...</p>
        ) : errorRange ? (
          <p className="text-red-600">{errorRange}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="py-2 pr-4">Fecha</th>
                  <th className="py-2 pr-4">Total</th>
                  <th className="py-2 pr-4">Internos</th>
                  <th className="py-2 pr-4">Externos</th>
                </tr>
              </thead>
              <tbody>
                {rangeRows.length === 0 ? (
                  <tr><td colSpan={4} className="py-3 text-gray-500">Sin datos</td></tr>
                ) : (
                  rangeRows.map((r, i) => (
                    <tr key={`range-${r.fecha}-${i}`} className="border-t">
                      <td className="py-2 pr-4">{r.fecha}</td>
                      <td className="py-2 pr-4">{r.total}</td>
                      <td className="py-2 pr-4">{r.internos}</td>
                      <td className="py-2 pr-4">{r.externos}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Últimos registros */}
      <section className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Últimos registros de asistencia</h2>
          <button onClick={fetchRecent} className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded">Refrescar</button>
        </div>
        {loadingRecent ? (
          <p className="text-gray-500">Cargando...</p>
        ) : errorRecent ? (
          <p className="text-red-600">{errorRecent}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="py-2 pr-4">Fecha/Hora</th>
                  <th className="py-2 pr-4">Participante</th>
                  <th className="py-2 pr-4">Tipo</th>
                  <th className="py-2 pr-4">ID</th>
                </tr>
              </thead>
              <tbody>
                {recent.length === 0 ? (
                  <tr><td colSpan={4} className="py-3 text-gray-500">Sin registros</td></tr>
                ) : (
                  recent.map((r, i) => (
                    <tr
                      key={`asist-${r.tipo ?? 'gen'}-${r.id ?? 'x'}-${r.participante_id ?? 'x'}-${new Date(r.registrado_en).getTime()}-${i}`}
                      className="border-t"
                    >
                      <td className="py-2 pr-4">{new Date(r.registrado_en).toLocaleString()}</td>
                      <td className="py-2 pr-4">{r.nombre}</td>
                      <td className="py-2 pr-4 capitalize">{r.tipo}</td>
                      <td className="py-2 pr-4">{r.participante_id}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
