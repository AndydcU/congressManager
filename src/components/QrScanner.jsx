'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';

// Importa el lector compatible con Next.js
const QrReader = dynamic(() => import('react-qr-barcode-scanner'), { ssr: false });

export default function QrScanner({ onScan }) {
  const [data, setData] = useState(null);

  return (
    <div className="w-full max-w-md flex flex-col items-center justify-center">
      <QrReader
        onUpdate={(err, result) => {
          if (result) {
            const text = result.text;
            setData(text);
            if (onScan) onScan(text); // 👈 llama al padre (Asistencia)
          }
        }}
      />
      {data && (
        <div className="mt-4 p-2 bg-gray-100 rounded text-center">
          <p className="text-green-600 font-medium">Resultado:</p>
          <p className="break-all text-gray-700">{data}</p>
        </div>
      )}
    </div>
  );
}
