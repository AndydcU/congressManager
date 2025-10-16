'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegistroPage() {
  const [form, setForm] = useState({
    nombre: '',
    correo: '',
    password: '',
    tipo_usuario: 'externo', // externo o interno
    colegio: '',
    telefono: '',
    grado: '',
    carnet: '', // Solo para internos
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validación de correo institucional para alumnos internos
    if (form.tipo_usuario === 'interno' && !form.correo.endsWith('@miumg.edu.gt')) {
      setError('Los alumnos internos deben usar su correo institucional (@miumg.edu.gt)');
      return;
    }

    const res = await fetch('/api/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Error en el registro');
      return;
    }

    setSuccess(true);

    // 🔐 Guarda el usuario completo con el ID que devuelve el API
    localStorage.setItem(
      'user',
      JSON.stringify({ 
        id: data.id, 
        nombre: form.nombre, 
        correo: form.correo, 
        rol: 'usuario' 
      })
    );

    router.push('/talleresYcompetencias');
  };

  return (
    <div className="max-w-md mx-auto mt-12 bg-white p-8 rounded-lg shadow">
      <h1 className="text-2xl font-bold text-center mb-4">Registro de Participante</h1>
      <p className="text-sm text-gray-600 text-center mb-4">
        Completa el formulario según tu tipo de participación
      </p>

      {/* Advertencia sobre el diploma */}
      <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4 mb-4">
        <div className="flex items-start gap-2">
          <span className="text-xl">📜</span>
          <div>
            <h4 className="font-semibold text-amber-900 text-sm mb-1">Importante: Nombre del Diploma</h4>
            <p className="text-xs text-amber-800">
              El nombre que ingreses a continuación será el que aparecerá en tu diploma al finalizar el congreso. 
              Asegúrate de escribirlo correctamente tal como deseas que aparezca.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
        {/* Tipo de Usuario */}
        <div>
          <label className="block text-sm font-medium mb-2">Tipo de Participante *</label>
          <select
            name="tipo_usuario"
            value={form.tipo_usuario}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2"
          >
            <option value="externo">Externo (Colegio externo)</option>
            <option value="interno">Interno (Estudiante de la institución)</option>
          </select>
        </div>
        <input
          type="text"
          name="nombre"
          placeholder="Nombre completo"
          value={form.nombre}
          onChange={handleChange}
          required
          autoComplete="name"
          className="w-full border rounded px-3 py-2"
        />
        <input
          type="email"
          name="correo"
          placeholder="Correo electrónico"
          value={form.correo}
          onChange={handleChange}
          required
          autoComplete="email"
          className="w-full border rounded px-3 py-2"
        />
        <input
          type="password"
          name="password"
          placeholder="Contraseña"
          value={form.password}
          onChange={handleChange}
          required
          autoComplete="new-password"
          className="w-full border rounded px-3 py-2"
        />
        {/* Campos condicionales según tipo de usuario */}
        {form.tipo_usuario === 'interno' && (
          <>
            <input
              type="text"
              name="carnet"
              placeholder="Número de carnet *"
              value={form.carnet}
              onChange={handleChange}
              required
              className="w-full border rounded px-3 py-2"
            />
            <input
              type="text"
              name="grado"
              placeholder="Grado/Año (ej: 5to Perito)"
              value={form.grado}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
          </>
        )}
        
        {form.tipo_usuario === 'externo' && (
          <input
            type="text"
            name="colegio"
            placeholder="Nombre del colegio *"
            value={form.colegio}
            onChange={handleChange}
            required
            autoComplete="organization"
            className="w-full border rounded px-3 py-2"
          />
        )}
        <input
          type="tel"
          name="telefono"
          placeholder="Teléfono (opcional)"
          value={form.telefono}
          onChange={handleChange}
          autoComplete="tel"
          className="w-full border rounded px-3 py-2"
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}
        {success && (
          <p className="text-green-600 text-sm text-center">
            ¡Registro exitoso! Redirigiendo...
          </p>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white font-semibold py-2 rounded hover:bg-blue-700"
        >
          Registrarme
        </button>
      </form>
    </div>
  );
}
