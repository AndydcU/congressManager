'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminTalleresPage() {
  const [user, setUser] = useState(null);
  const [talleres, setTalleres] = useState([]);
  const [competencias, setCompetencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ 
    nombre: '', 
    descripcion: '', 
    hora_inicio: '', 
    hora_fin: '', 
    cupo: 0, 
    costo: 0,
    fecha: '' 
  });
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
    fetchData();
  }, [router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tRes, cRes] = await Promise.all([
        fetch('/api/talleres'),
        fetch('/api/competencias')
      ]);
      const tData = await tRes.json();
      const cData = await cRes.json();
      setTalleres(Array.isArray(tData) ? tData : []);
      setCompetencias(Array.isArray(cData) ? cData : []);
    } catch (err) {
      console.error('Error cargando datos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = showForm === 'taller' ? '/api/talleres' : '/api/competencias';
    const method = editingId ? 'PUT' : 'POST';
    const bodyData = editingId ? { ...form, id: editingId } : form;
    
    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });

      if (res.ok) {
        alert(`${showForm === 'taller' ? 'Taller' : 'Competencia'} ${editingId ? 'actualizado' : 'creado'} exitosamente`);
        setForm({ nombre: '', descripcion: '', hora_inicio: '', hora_fin: '', cupo: 0, costo: 0, fecha: '' });
        setShowForm(null);
        setEditingId(null);
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Error al guardar');
      }
    } catch (err) {
      alert('Error de red');
    }
  };

  const handleEdit = (item, type) => {
    setEditingId(item.id);
    setShowForm(type);
    let fechaFormatted = '';
    if (item.fecha) {
      const date = new Date(item.fecha);
      fechaFormatted = date.toISOString().split('T')[0];
    }
    setForm({
      nombre: item.nombre || '',
      descripcion: item.descripcion || '',
      hora_inicio: item.hora_inicio || '',
      hora_fin: item.hora_fin || '',
      cupo: item.cupo || 0,
      costo: item.costo || 0,
      fecha: fechaFormatted
    });
  };

  const handleDelete = async (id, type) => {
    if (!confirm(`¿Está seguro de eliminar este ${type === 'taller' ? 'taller' : 'competencia'}?`)) {
      return;
    }

    const endpoint = type === 'taller' ? '/api/talleres' : '/api/competencias';
    
    try {
      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      if (res.ok) {
        alert(`${type === 'taller' ? 'Taller' : 'Competencia'} eliminado exitosamente`);
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Error al eliminar');
      }
    } catch (err) {
      alert('Error de red');
    }
  };

  const cancelForm = () => {
    setShowForm(null);
    setEditingId(null);
    setForm({ nombre: '', descripcion: '', hora_inicio: '', hora_fin: '', cupo: 0, costo: 0, fecha: '' });
  };

  if (!user) return <p className="text-center mt-10">Verificando acceso...</p>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gestión de Talleres y Competencias</h1>
        <a href="/admin/panel" className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
          ← Volver al Panel
        </a>
      </header>

      <div className="flex gap-4">
        <button
          onClick={() => setShowForm('taller')}
          className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + Crear Taller
        </button>
        <button
          onClick={() => setShowForm('competencia')}
          className="px-6 py-3 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          + Crear Competencia
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              {editingId ? 'Editar' : 'Crear'} {showForm === 'taller' ? 'Taller' : 'Competencia'}
            </h2>
            <button onClick={cancelForm} className="text-gray-500 hover:text-gray-700">
              ✕ Cancelar
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre *</label>
              <input
                type="text"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                required
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Descripción</label>
              <textarea
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                rows={3}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Hora Inicio</label>
                <input
                  type="time"
                  value={form.hora_inicio}
                  onChange={(e) => setForm({ ...form, hora_inicio: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Hora Fin</label>
                <input
                  type="time"
                  value={form.hora_fin}
                  onChange={(e) => setForm({ ...form, hora_fin: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Cupo</label>
                <input
                  type="number"
                  value={form.cupo}
                  onChange={(e) => setForm({ ...form, cupo: Number(e.target.value) })}
                  min="0"
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Costo (Q) *</label>
                <input
                  type="number"
                  value={form.costo}
                  onChange={(e) => setForm({ ...form, costo: Number(e.target.value) })}
                  min="0"
                  step="0.01"
                  required
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Fecha *</label>
              <input
                type="date"
                lang="es-GT"
                value={form.fecha}
                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                required
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <button type="submit" className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">
              {editingId ? 'Actualizar' : 'Crear'} {showForm === 'taller' ? 'Taller' : 'Competencia'}
            </button>
          </form>
        </div>
      )}

      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-semibold mb-4">Talleres ({talleres.length})</h2>
        {loading ? (
          <p className="text-gray-500">Cargando...</p>
        ) : talleres.length === 0 ? (
          <p className="text-gray-500">No hay talleres creados</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-4">ID</th>
                  <th className="py-2 pr-4">Nombre</th>
                  <th className="py-2 pr-4">Fecha</th>
                  <th className="py-2 pr-4">Horario</th>
                  <th className="py-2 pr-4">Costo</th>
                  <th className="py-2 pr-4">Cupo</th>
                  <th className="py-2 pr-4">Inscritos</th>
                  <th className="py-2 pr-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {talleres.map((t) => (
                  <tr key={t.id} className="border-b">
                    <td className="py-2 pr-4">{t.id}</td>
                    <td className="py-2 pr-4 font-medium">{t.nombre}</td>
                    <td className="py-2 pr-4">{t.fecha ? new Date(t.fecha).toLocaleDateString('es-GT') : '-'}</td>
                    <td className="py-2 pr-4">
                      {t.hora_inicio && t.hora_fin ? `${t.hora_inicio} - ${t.hora_fin}` : '-'}
                    </td>
                    <td className="py-2 pr-4">Q{t.costo || 0}</td>
                    <td className="py-2 pr-4">{t.cupo}</td>
                    <td className="py-2 pr-4">
                      <span className={`font-bold ${t.inscritos >= t.cupo ? 'text-red-600' : 'text-green-600'}`}>
                        {t.inscritos || 0}
                      </span>
                    </td>
                    <td className="py-2 pr-4">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleEdit(t, 'taller')}
                          className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                        >
                          ✏️ Editar
                        </button>
                        <button 
                          onClick={() => handleDelete(t.id, 'taller')}
                          className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-semibold mb-4">Competencias ({competencias.length})</h2>
        {loading ? (
          <p className="text-gray-500">Cargando...</p>
        ) : competencias.length === 0 ? (
          <p className="text-gray-500">No hay competencias creadas</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-4">ID</th>
                  <th className="py-2 pr-4">Nombre</th>
                  <th className="py-2 pr-4">Fecha</th>
                  <th className="py-2 pr-4">Horario</th>
                  <th className="py-2 pr-4">Costo</th>
                  <th className="py-2 pr-4">Cupo</th>
                  <th className="py-2 pr-4">Inscritos</th>
                  <th className="py-2 pr-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {competencias.map((c) => (
                  <tr key={c.id} className="border-b">
                    <td className="py-2 pr-4">{c.id}</td>
                    <td className="py-2 pr-4 font-medium">{c.nombre}</td>
                    <td className="py-2 pr-4">{c.fecha ? new Date(c.fecha).toLocaleDateString('es-GT') : '-'}</td>
                    <td className="py-2 pr-4">
                      {c.hora_inicio && c.hora_fin ? `${c.hora_inicio} - ${c.hora_fin}` : '-'}
                    </td>
                    <td className="py-2 pr-4">Q{c.costo || 0}</td>
                    <td className="py-2 pr-4">{c.cupo}</td>
                    <td className="py-2 pr-4">
                      <span className={`font-bold ${c.inscritos >= c.cupo ? 'text-red-600' : 'text-green-600'}`}>
                        {c.inscritos || 0}
                      </span>
                    </td>
                    <td className="py-2 pr-4">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleEdit(c, 'competencia')}
                          className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                        >
                          ✏️ Editar
                        </button>
                        <button 
                          onClick={() => handleDelete(c.id, 'competencia')}
                          className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
