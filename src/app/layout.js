import '@/styles/globals.css';
import Navbar from '@/components/Navbar';

export const metadata = {
  title: 'Gestor de Congreso',
  description: 'Sistema de gestión para talleres, competencias y asistencia',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-gray-50 text-gray-800">
        <header className="bg-white shadow-md">
          <Navbar />
        </header>
        <main className="container mx-auto p-6">{children}</main>
      </body>
    </html>
  );
}
