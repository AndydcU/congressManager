'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
  }, [pathname]);

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('participante_id');
    setUser(null);
    router.push('/');
  };

  const isActive = (path) => pathname === path;

  return (
    <nav className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 shadow-lg sticky top-0 z-50 border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo y Título */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center transform group-hover:scale-110 transition-transform duration-200">
              <span className="text-white font-bold text-xl">CT</span>
            </div>
            <span className="text-xl font-bold text-white hidden sm:block">
              Congreso de Tecnología
            </span>
            <span className="text-xl font-bold text-white sm:hidden">
              CT
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-1">
            <Link 
              href="/" 
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/') 
                  ? 'bg-gray-700 text-white' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              Inicio
            </Link>
            <Link 
              href="/talleres" 
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/talleres') 
                  ? 'bg-gray-700 text-white' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              Talleres
            </Link>
            <Link 
              href="/competencias" 
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/competencias') 
                  ? 'bg-gray-700 text-white' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              Competencias
            </Link>
            {user?.rol !== 'admin' && (
              <Link 
                href="/inscripcion" 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/inscripcion') 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:bg-blue-600 hover:text-white'
                }`}
              >
                Inscripción
              </Link>
            )}
            <Link 
              href="/resultados" 
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/resultados') 
                  ? 'bg-gray-700 text-white' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              Resultados
            </Link>
            {user && user.rol !== 'admin' && (
              <>
                <Link 
                  href="/mi-perfil" 
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/mi-perfil') 
                      ? 'bg-gray-700 text-white' 
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  Mi Perfil
                </Link>
                <Link 
                  href="/mis-diplomas" 
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/mis-diplomas') 
                      ? 'bg-gray-700 text-white' 
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  Mis Diplomas
                </Link>
              </>
            )}
            <Link 
              href="/faq" 
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/faq') 
                  ? 'bg-gray-700 text-white' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              FAQ
            </Link>
            {user?.rol === 'admin' && (
              <>
                <Link 
                  href="/asistencia" 
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/asistencia') 
                      ? 'bg-gray-700 text-white' 
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  Asistencia
                </Link>
                <Link 
                  href="/admin/panel" 
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/admin/panel') 
                      ? 'bg-red-600 text-white' 
                      : 'text-red-400 hover:bg-red-600 hover:text-white'
                  }`}
                >
                  Panel Admin
                </Link>
              </>
            )}
          </div>

          {/* User Actions */}
          <div className="hidden md:flex items-center gap-3">
            {!user ? (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  href="/registro"
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-medium rounded-md hover:from-blue-600 hover:to-indigo-700 transition-all transform hover:scale-105"
                >
                  Registrarse
                </Link>
              </>
            ) : (
              <>
                <span className="text-sm text-gray-300">
                  <span className="text-gray-500">Hola,</span> <span className="font-semibold">{user.nombre}</span>
                </span>
                <button
                  onClick={logout}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-md transition-colors"
                >
                  Cerrar Sesión
                </button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-700 bg-gray-800">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link href="/" className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white">
              Inicio
            </Link>
            <Link href="/talleres" className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white">
              Talleres
            </Link>
            <Link href="/competencias" className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white">
              Competencias
            </Link>
            {user?.rol !== 'admin' && (
              <Link href="/inscripcion" className="block px-3 py-2 rounded-md text-base font-medium text-blue-400 hover:bg-blue-600 hover:text-white">
                Inscripción
              </Link>
            )}
            <Link href="/resultados" className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white">
              Resultados
            </Link>
            {user && user.rol !== 'admin' && (
              <>
                <Link href="/mi-perfil" className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white">
                  Mi Perfil
                </Link>
                <Link href="/mis-diplomas" className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white">
                  Mis Diplomas
                </Link>
              </>
            )}
            <Link href="/faq" className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white">
              FAQ
            </Link>
            {user?.rol === 'admin' && (
              <>
                <Link href="/asistencia" className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white">
                  Asistencia
                </Link>
                <Link href="/admin/panel" className="block px-3 py-2 rounded-md text-base font-medium text-red-400 hover:bg-red-600 hover:text-white">
                  Panel Admin
                </Link>
              </>
            )}
            
            {!user ? (
              <div className="pt-4 space-y-2">
                <Link href="/login" className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white">
                  Iniciar Sesión
                </Link>
                <Link href="/registro" className="block px-3 py-2 rounded-md text-base font-medium bg-blue-600 text-white hover:bg-blue-700">
                  Registrarse
                </Link>
              </div>
            ) : (
              <div className="pt-4 border-t border-gray-700">
                <div className="px-3 py-2 text-sm text-gray-400">
                  Hola, <span className="font-semibold text-white">{user.nombre}</span>
                </div>
                <button
                  onClick={logout}
                  className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
