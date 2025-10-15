export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-r from-blue-900 to-blue-800 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-8 mb-6">
          {/* Sección 1: Información */}
          <div>
            <h3 className="text-lg font-bold mb-3">Congreso de Tecnología</h3>
            <p className="text-blue-200 text-sm">
              Universidad Mariano Gálvez de Guatemala
            </p>
            <p className="text-blue-200 text-sm mt-2">
              Promoviendo la excelencia en tecnología e innovación
            </p>
          </div>

          {/* Sección 2: Enlaces Rápidos */}
          <div>
            <h3 className="text-lg font-bold mb-3">Enlaces Rápidos</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/" className="text-blue-200 hover:text-white transition">
                  Inicio
                </a>
              </li>
              <li>
                <a href="/talleres" className="text-blue-200 hover:text-white transition">
                  Talleres
                </a>
              </li>
              <li>
                <a href="/competencias" className="text-blue-200 hover:text-white transition">
                  Competencias
                </a>
              </li>
              <li>
                <a href="/faq" className="text-blue-200 hover:text-white transition">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Sección 3: Contacto */}
          <div>
            <h3 className="text-lg font-bold mb-3">Contacto</h3>
            <ul className="space-y-2 text-sm text-blue-200">
              <li className="flex items-center gap-2">
                <span>📧</span>
                <span>congreso@umg.edu.gt</span>
              </li>
              <li className="flex items-center gap-2">
                <span>📱</span>
                <span>+502 2411-1800</span>
              </li>
              <li className="flex items-center gap-2">
                <span>📍</span>
                <span>Guatemala, Guatemala</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Línea divisoria */}
        <div className="border-t border-blue-700 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-blue-200">
              © {currentYear} UMG Congreso. Todos los derechos reservados.
            </p>
            <div className="flex gap-6 text-sm text-blue-200">
              <a href="#" className="hover:text-white transition">
                Términos de Uso
              </a>
              <a href="#" className="hover:text-white transition">
                Privacidad
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
