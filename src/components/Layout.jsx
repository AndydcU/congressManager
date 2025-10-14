// src/app/layout.jsx
import Link from 'next/link';
import './globals.css';

export const metadata = { title: 'Congreso Manager' };

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <header style={{ padding: '1rem', borderBottom: '1px solid #ccc' }}>
          <nav>
            <Link href="/" style={{ marginRight: '1rem' }}>Inicio</Link>
            <Link href="/inscripcion" style={{ marginRight: '1rem' }}>Inscripción</Link>
            <Link href="/participantes">Participantes</Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
