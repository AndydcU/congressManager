'use client';
import { useEffect } from 'react';

export default function DiplomaAutoGenerator() {
  useEffect(() => {
    const verificarDiplomas = async () => {
      try {
        const response = await fetch('/api/diplomas/verificar-y-generar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.generados > 0) {
            console.log(`${data.generados} diplomas generados`);
          }
        }
      } catch (error) {
        console.error('Error en verificación de diplomas:', error);
      }
    };

    verificarDiplomas();
    const intervalo = setInterval(verificarDiplomas, 300000);

    return () => clearInterval(intervalo);
  }, []);

  return null;
}
