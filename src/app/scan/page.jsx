'use client';

import { useState } from 'react';
import QrScanner from '@/components/QrScanner';

export default function ScanPage() {
  const [status, setStatus] = useState(null);

  const handleScan = async (text) => {
    if (!text) return;

    const trimmed = String(text).trim();

    // Extrae token o participante_id de QR 
    let token = null;
    let participante_id = null;

    // Prueba JSON primero
    try {
      const obj = JSON.parse(trimmed);
      if (obj && typeof obj.token === 'string') {
        token = obj.token;
      } else if (obj && (obj.participante_id || obj.pid)) {
        participante_id = obj.participante_id || obj.pid;
      }
    } catch (_) {
      const n = parseInt(trimmed, 10);
      if (!Number.isNaN(n) && String(n) === trimmed) {
        participante_id = n;
      } else if (trimmed.length >= 16) {
        token = trimmed; 
      }
    }

    if (!token && !participante_id) {
      setStatus({ type: 'error', message: 'QR inválido: no se encontró token ni participante_id.' });
      return;
    }

    setStatus({ type: 'loading', message: 'Registrando asistencia...' });
    try {
      let res;
      if (token) {
        res = await fetch('/api/asistencia/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
      } else {
        res = await fetch('/api/asistencia', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ participante_id }),
        });
      }

      if (res.status === 201) {
        setStatus({
          type: 'success',
          message: token
            ? 'Asistencia registrada (token).'
            : `Asistencia registrada para ID ${participante_id}.`,
        });
      } else {
        const body = await res.json().catch(() => ({}));
        const msg = body?.error || `Error al registrar asistencia (HTTP ${res.status}).`;
        setStatus({ type: 'error', message: msg });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Fallo de red o servidor al registrar la asistencia.' });
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <QrScanner onScan={handleScan} />
      </div>

      {status && (
        <div
          className={`mt-4 w-full max-w-md p-3 rounded text-sm ${
            status.type === 'success'
              ? 'bg-green-100 text-green-800'
              : status.type === 'loading'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {status.message}
        </div>
      )}
    </main>
  );
}
