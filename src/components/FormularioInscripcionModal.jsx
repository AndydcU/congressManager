'use client';
import { useState, useEffect } from 'react';

export default function FormularioInscripcionModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  actividad, 
  tipoActividad, // 'taller' o 'competencia'
  participante 
}) {
  const [formData, setFormData] = useState({
    // Campos comunes
    confirmacion: false,
    
    // Campos para externos
    colegio_confirmado: '',
    grado_confirmado: '',
    contacto_emergencia: '',
    telefono_emergencia: '',
    
    // Campos para internos
    carnet_confirmado: '',
    carrera: '',
    anio_carrera: '',
    
    // Campos específicos para competencias
    nombre_equipo: '',
    integrantes_equipo: '',
    experiencia_previa: '',
    herramientas_disponibles: '',
    
    // Campos específicos para talleres
    nivel_conocimiento: '',
    expectativas: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && participante) {
      // Pre-llenar campos conocidos
      setFormData(prev => ({
        ...prev,
        colegio_confirmado: participante.colegio || '',
        grado_confirmado: participante.grado || '',
        carnet_confirmado: participante.carnet || '',
      }));
    }
  }, [isOpen, participante]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.confirmacion) {
      setError('Debes confirmar que la información es correcta');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err.message || 'Error al procesar inscripción');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isExterno = participante?.tipo_usuario === 'externo' || participante?.tipo === 'externo';
  const isInterno = participante?.tipo_usuario === 'interno' || participante?.tipo === 'interno';
  const isCompetencia = tipoActividad === 'competencia';
  const isTaller = tipoActividad === 'taller';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-t-lg">
          <h2 className="text-2xl font-bold">Completar Inscripción</h2>
          <p className="text-sm opacity-90 mt-1">{actividad?.nombre}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Información de la actividad */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">📋 Detalles de la Actividad</h3>
            <div className="text-sm text-gray-700 space-y-1">
              <p><strong>Tipo:</strong> {isCompetencia ? 'Competencia' : 'Taller'}</p>
              <p><strong>Nombre:</strong> {actividad?.nombre}</p>
              {actividad?.fecha_realizacion && (
                <p><strong>Fecha:</strong> {new Date(actividad.fecha_realizacion).toLocaleDateString('es-GT', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</p>
              )}
              {actividad?.horario && <p><strong>Horario:</strong> {actividad.horario}</p>}
              {actividad?.precio !== undefined && (
                <p><strong>Precio:</strong> <span className="font-bold text-green-700">
                  {actividad.precio > 0 ? `Q${parseFloat(actividad.precio).toFixed(2)}` : 'GRATIS'}
                </span></p>
              )}
            </div>
          </div>

          {/* Advertencia sobre el nombre en el diploma */}
          <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📜</span>
              <div>
                <h4 className="font-semibold text-amber-900 mb-1">Importante: Diploma</h4>
                <p className="text-sm text-amber-800">
                  El nombre que ingresaste al registrarte (<strong>{participante?.nombre}</strong>) será el que aparecerá en tu diploma. 
                  Asegúrate de que sea correcto. Si necesitas modificarlo, contacta al administrador antes de la fecha del evento.
                </p>
              </div>
            </div>
          </div>

          {/* Campos según tipo de usuario - Externos */}
          {isExterno && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 border-b pb-2">👨‍🎓 Información de Estudiante Externo</h3>
              
              <div>
                <label className="block text-sm font-medium mb-1">Colegio/Universidad *</label>
                <input
                  type="text"
                  name="colegio_confirmado"
                  value={formData.colegio_confirmado}
                  onChange={handleChange}
                  required
                  className="w-full border rounded px-3 py-2"
                  placeholder="Nombre completo del colegio o universidad"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Grado/Año *</label>
                <input
                  type="text"
                  name="grado_confirmado"
                  value={formData.grado_confirmado}
                  onChange={handleChange}
                  required
                  className="w-full border rounded px-3 py-2"
                  placeholder="Ej: 5to Bachillerato, 3ro Básico o semestre y carrera"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Contacto *</label>
                <input
                  type="text"
                  name="contacto_emergencia"
                  value={formData.contacto_emergencia}
                  onChange={handleChange}
                  required
                  className="w-full border rounded px-3 py-2"
                  placeholder="Nombre del contacto"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Teléfono de Contacto *</label>
                <input
                  type="tel"
                  name="telefono_emergencia"
                  value={formData.telefono_emergencia}
                  onChange={handleChange}
                  required
                  className="w-full border rounded px-3 py-2"
                  placeholder="5555-5555"
                />
              </div>
            </div>
          )}

          {/* Campos según tipo de usuario - Internos */}
          {isInterno && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 border-b pb-2">🎓 Información de Estudiante Interno</h3>
              
              <div>
                <label className="block text-sm font-medium mb-1">Carnet *</label>
                <input
                  type="text"
                  name="carnet_confirmado"
                  value={formData.carnet_confirmado}
                  onChange={handleChange}
                  required
                  className="w-full border rounded px-3 py-2"
                  placeholder="Número de carnet"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Carrera *</label>
                <select
                  name="carrera"
                  value={formData.carrera}
                  onChange={handleChange}
                  required
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Selecciona tu carrera</option>
                  <option value="Ingeniería en Sistemas">Ingeniería en Sistemas</option>
                  <option value="Ingeniería Industrial">Ingeniería Industrial</option>
                  <option value="Ingeniería Civil">Ingeniería Civil</option>
                  <option value="Otra">Otra</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Año de Carrera *</label>
                <select
                  name="anio_carrera"
                  value={formData.anio_carrera}
                  onChange={handleChange}
                  required
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Selecciona el año</option>
                  <option value="1">Primer año</option>
                  <option value="2">Segundo año</option>
                  <option value="3">Tercer año</option>
                  <option value="4">Cuarto año</option>
                  <option value="5">Quinto año</option>
                </select>
              </div>
            </div>
          )}

          {/* Campos específicos para Competencias */}
          {isCompetencia && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 border-b pb-2">🏆 Información de Competencia</h3>
              
              <div>
                <label className="block text-sm font-medium mb-1">Nombre del Equipo</label>
                <input
                  type="text"
                  name="nombre_equipo"
                  value={formData.nombre_equipo}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Deja vacío si participas individualmente"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Integrantes del Equipo</label>
                <textarea
                  name="integrantes_equipo"
                  value={formData.integrantes_equipo}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                  rows="3"
                  placeholder="Nombres de los integrantes (uno por línea)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Experiencia Previa *</label>
                <select
                  name="experiencia_previa"
                  value={formData.experiencia_previa}
                  onChange={handleChange}
                  required
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Selecciona tu nivel</option>
                  <option value="Ninguna">Ninguna experiencia</option>
                  <option value="Principiante">Principiante</option>
                  <option value="Intermedio">Intermedio</option>
                  <option value="Avanzado">Avanzado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Herramientas/Software Disponible</label>
                <textarea
                  name="herramientas_disponibles"
                  value={formData.herramientas_disponibles}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                  rows="2"
                  placeholder="Ej: Laptop con Python, Git, IDE, etc."
                />
              </div>
            </div>
          )}

          {/* Campos específicos para Talleres */}
          {isTaller && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 border-b pb-2">📚 Información del Taller</h3>
              
              <div>
                <label className="block text-sm font-medium mb-1">Nivel de Conocimiento en el Tema *</label>
                <select
                  name="nivel_conocimiento"
                  value={formData.nivel_conocimiento}
                  onChange={handleChange}
                  required
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Selecciona tu nivel</option>
                  <option value="Ninguno">Sin conocimiento previo</option>
                  <option value="Básico">Conocimiento básico</option>
                  <option value="Intermedio">Conocimiento intermedio</option>
                  <option value="Avanzado">Conocimiento avanzado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">¿Qué esperas aprender en este taller? *</label>
                <textarea
                  name="expectativas"
                  value={formData.expectativas}
                  onChange={handleChange}
                  required
                  className="w-full border rounded px-3 py-2"
                  rows="3"
                  placeholder="Describe brevemente tus expectativas..."
                />
              </div>
            </div>
          )}

          {/* Información de Pago */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-5">
            <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
              <span className="text-xl">💳</span>
              Información de Pago
            </h3>
            <div className="space-y-3 text-sm">
              <div className="bg-white rounded-lg p-3 border border-green-200">
                <p className="font-medium text-gray-800 mb-1">Costo de la actividad:</p>
                <p className="text-2xl font-bold text-green-700">
                  {actividad?.precio > 0 ? `Q${Number(actividad.precio).toFixed(2)}` : 'GRATIS'}
                </p>
              </div>
              
              {actividad?.precio > 0 && (
                <div className="bg-white rounded-lg p-3 border border-green-200 space-y-2">
                  <p className="font-medium text-gray-800">Métodos de pago disponibles:</p>
                  <ul className="text-gray-700 space-y-1 ml-4">
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      Efectivo (en ventanilla)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      Transferencia bancaria
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      Tarjeta de crédito/débito
                    </li>
                  </ul>
                  <p className="text-xs text-gray-600 mt-3 bg-yellow-50 p-2 rounded border border-yellow-200">
                    <strong>Nota:</strong> El pago deberá realizarse previo al evento. Recibirás instrucciones detalladas después de confirmar tu inscripción.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Confirmación */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="confirmacion"
                checked={formData.confirmacion}
                onChange={handleChange}
                className="mt-1"
                required
              />
              <span className="text-sm text-gray-700">
                Confirmo que toda la información proporcionada es correcta y me comprometo a asistir a la actividad en la fecha y hora indicadas.
              </span>
            </label>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">
              {error}
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !formData.confirmacion}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {loading ? '⏳ Procesando...' : '✅ Confirmar Inscripción'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
