'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const [talleres, setTalleres] = useState([]);
  const [competencias, setCompetencias] = useState([]);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/talleres')
      .then(res => res.json())
      .then(data => setTalleres(Array.isArray(data) ? data.slice(0, 3) : []))
      .catch(err => console.error('Error cargando talleres:', err));

    fetch('/api/competencias')
      .then(res => res.json())
      .then(data => setCompetencias(Array.isArray(data) ? data.slice(0, 3) : []))
      .catch(err => console.error('Error cargando competencias:', err));

    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      {/* Para agregar imagen de fondo: coloca tu imagen en public/hero-background.jpg */}
      <section 
        className="hero-overlay text-white py-20 bg-gradient-to-r from-blue-600 to-indigo-700"
        style={{
          backgroundImage: 'url(/hero-background.jpg)',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 text-center space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold">Congreso de Tecnología</h1>
          <p className="text-xl md:text-2xl">
            Promoviendo la Ingeniería en Sistemas y la Innovación Tecnológica
          </p>
          <p className="text-lg max-w-3xl mx-auto">
            Únete a nosotros en este evento anual donde estudiantes de nivel medio y alumnos de la facultad 
            participan en talleres, competencias y actividades académicas de vanguardia.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            {!user ? (
              <>
                <Link href="/registro" className="px-8 py-3 bg-white text-blue-700 font-semibold rounded-lg hover:bg-gray-100 transition">
                  Registrarse Ahora
                </Link>
                <Link href="/login" className="px-8 py-3 bg-blue-800 text-white font-semibold rounded-lg hover:bg-blue-900 transition">
                  Iniciar Sesión
                </Link>
              </>
            ) : (
              <Link href="/inscripcion" className="px-8 py-3 bg-white text-blue-700 font-semibold rounded-lg hover:bg-gray-100 transition">
                Inscribirme a Actividades
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Sobre el Congreso */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-4xl font-bold">Sobre el Congreso</h2>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto">
            El Congreso de Tecnología es un evento anual organizado por la facultad con el objetivo de 
            promover la carrera de Ingeniería en Sistemas entre estudiantes de nivel medio y ofrecer a 
            nuestros alumnos una plataforma para desarrollar habilidades técnicas y competir en desafíos innovadores.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <div className="text-4xl mb-3">🎓</div>
            <h3 className="text-xl font-semibold mb-2">Talleres Especializados</h3>
            <p className="text-gray-600">
              Aprende de expertos en áreas como IA, desarrollo web, ciberseguridad y más.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <div className="text-4xl mb-3">🏆</div>
            <h3 className="text-xl font-semibold mb-2">Competencias</h3>
            <p className="text-gray-600">
              Demuestra tus habilidades en competencias de programación, robótica y proyectos innovadores.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <div className="text-4xl mb-3">📜</div>
            <h3 className="text-xl font-semibold mb-2">Diplomas</h3>
            <p className="text-gray-600">
              Recibe diplomas digitales por tu participación y logros en el congreso.
            </p>
          </div>
        </div>
      </section>

      {/* Talleres Destacados */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-bold mb-2">Talleres Destacados</h2>
            <p className="text-gray-600">Explora algunos de nuestros talleres más populares</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {talleres.length === 0 ? (
              <p className="col-span-3 text-center text-gray-500">Cargando talleres...</p>
            ) : (
              talleres.map((t) => (
                <div key={t.id} className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-xl font-semibold mb-2">{t.nombre}</h3>
                  <p className="text-gray-600 text-sm mb-3">{t.descripcion}</p>
                  {t.fecha_realizacion && (
                    <p className="text-sm text-gray-500">📅 Fecha: {new Date(t.fecha_realizacion).toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  )}
                  <p className="text-sm text-gray-500">🕐 Horario: {t.horario}</p>
                  <p className="text-sm text-gray-500">👥 Cupo: {t.cupo}</p>
                </div>
              ))
            )}
          </div>
          <div className="text-center mt-8">
            <Link href="/talleresYcompetencias" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              Ver Todos los Talleres
            </Link>
          </div>
        </div>
      </section>

      {/* Competencias */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold mb-2">Competencias</h2>
          <p className="text-gray-600">Participa y demuestra tu talento</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {competencias.length === 0 ? (
            <p className="col-span-3 text-center text-gray-500">Cargando competencias...</p>
          ) : (
            competencias.map((c) => (
              <div key={c.id} className="bg-white rounded-lg shadow p-6 border-l-4 border-indigo-600">
                <h3 className="text-xl font-semibold mb-2">{c.nombre}</h3>
                <p className="text-gray-600 text-sm mb-3">{c.descripcion}</p>
                {c.fecha_realizacion && (
                  <p className="text-sm text-gray-500">📅 Fecha: {new Date(c.fecha_realizacion).toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                )}
                <p className="text-sm text-gray-500">🕐 Horario: {c.horario}</p>
                <p className="text-sm text-gray-500">👥 Cupo: {c.cupo}</p>
              </div>
            ))
          )}
        </div>
        <div className="text-center mt-8">
          <Link href="/talleresYcompetencias" className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
            Ver Todas las Competencias
          </Link>
        </div>
      </section>

      {/* Resultados */}
      <section className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-16">
        <div className="max-w-6xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-4xl font-bold">Resultados y Ganadores</h2>
          <p className="text-lg max-w-3xl mx-auto">
            Consulta los resultados de las competencias y conoce a los ganadores de este año y años anteriores.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/resultados" className="px-6 py-3 bg-white text-purple-700 font-semibold rounded-lg hover:bg-gray-100 transition">
              Ver Resultados {new Date().getFullYear()}
            </Link>
            <Link href="/resultados/historico" className="px-6 py-3 bg-purple-800 text-white font-semibold rounded-lg hover:bg-purple-900 transition">
              Histórico de Ganadores
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold mb-2">¿Tienes Preguntas?</h2>
          <p className="text-gray-600">Consulta nuestra sección de preguntas frecuentes</p>
        </div>
        <div className="text-center">
          <Link href="/faq" className="inline-block px-8 py-3 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-900 transition">
            Ver Preguntas Frecuentes
          </Link>
        </div>
      </section>
    </div>
  );
}
