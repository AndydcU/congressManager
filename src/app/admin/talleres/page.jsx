'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminTalleresPage() {
  const [user, setUser] = useState(null);
  const [talleres, setTalleres] = useState([]);
  const [competencias, setCompetencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(null); // 'taller' | 'competencia' | null
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ 
    nombre: '', 
    descripcion: '', 
    horario: '', 
    cupo: 0, 
    precio: 0,
    fecha_realizacion: '' 
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
        setForm({ nombre: '', descripcion: '', horario: '', cupo: 0, precio: 0, fecha_realizacion: '' });
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
    // Convert MySQL DATE format to yyyy-MM-dd for input[type="date"]
    let fechaFormatted = '';
    if (item.fecha_realizacion) {
      const date = new Date(item.fecha_realizacion);
      fechaFormatted = date.toISOString().split('T')[0];
    }
    setForm({
      nombre: item.nombre || '',
      descripcion: item.descripcion || '',
      horario: item.horario || '',
      cupo: item.cupo || 0,
      precio: item.precio || 0,
      fecha_realizacion: fechaFormatted
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
    setForm({ nombre: '', descripcion: '', horario: '', cupo: 0, precio: 0, fecha_realizacion: '' });
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

      {/* Botones para crear */}
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

      {/* Formulario */}
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
                <label className="block text-sm font-medium mb-1">Horario</label>
                <input
                  type="text"
                  value={form.horario}
                  onChange={(e) => setForm({ ...form, horario: e.target.value })}
                  placeholder="Ej: 10:00 - 12:00"
                  className="w-full border rounded px-3 py-2"
                />
              </div>
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Precio (Q) *</label>
                <input
                  type="number"
                  value={form.precio}
                  onChange={(e) => setForm({ ...form, precio: Number(e.target.value) })}
                  min="0"
                  step="0.01"
                  required
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Fecha de Realización *</label>
                <input
                  type="date"
                  value={form.fecha_realizacion}
                  onChange={(e) => setForm({ ...form, fecha_realizacion: e.target.value })}
                  required
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>
            <button type="submit" className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">
              {editingId ? 'Actualizar' : 'Crear'} {showForm === 'taller' ? 'Taller' : 'Competencia'}
            </button>
          </form>
        </div>
      )}

      {/* Lista de Talleres */}
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
                  <th className="py-2 pr-4">Precio</th>
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
                    <td className="py-2 pr-4">{t.fecha_realizacion ? new Date(t.fecha_realizacion).toLocaleDateString() : '-'}</td>
                    <td className="py-2 pr-4">{t.horario || '-'}</td>
                    <td className="py-2 pr-4">Q{t.precio || 0}</td>
                    <td className="py-2 pr-4">{t.cupo}</td>
                    <td className="py-2 pr-4">
                      <span className={`font-bold ${t.participantes_inscritos >= t.cupo ? 'text-red-600' : 'text-green-600'}`}>
                        {t.participantes_inscritos || 0}
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

      {/* Lista de Competencias */}
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
                  <th className="py-2 pr-4">Precio</th>
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
                    <td className="py-2 pr-4">{c.fecha_realizacion ? new Date(c.fecha_realizacion).toLocaleDateString() : '-'}</td>
                    <td className="py-2 pr-4">{c.horario || '-'}</td>
                    <td className="py-2 pr-4">Q{c.precio || 0}</td>
                    <td className="py-2 pr-4">{c.cupo}</td>
                    <td className="py-2 pr-4">
                      <span className={`font-bold ${c.participantes_inscritos >= c.cupo ? 'text-red-600' : 'text-green-600'}`}>
                        {c.participantes_inscritos || 0}
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
