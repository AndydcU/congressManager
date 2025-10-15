import '@/styles/globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DiplomaAutoGenerator from '@/components/DiplomaAutoGenerator';

export const metadata = {
  title: 'Gestor de Congreso',
  description: 'Sistema de gestión para talleres, competencias y asistencia',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es-GT">
      <body className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-slate-100 text-gray-900 flex flex-col">
        <DiplomaAutoGenerator />
        <header className="bg-white shadow-md">
          <Navbar />
        </header>
        <main className="container mx-auto p-6 flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
