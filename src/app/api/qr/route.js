import QRCode from 'qrcode';

// GET /api/qr?token=...
// Devuelve imagen PNG del QR con contenido {"token":"..."}
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    if (!token) {
      return new Response(JSON.stringify({ error: 'token requerido' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const payload = JSON.stringify({ token });
    const pngBuffer = await QRCode.toBuffer(payload, { type: 'png', errorCorrectionLevel: 'M', width: 256 });

    return new Response(pngBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error en /api/qr:', error);
    return new Response(JSON.stringify({ error: 'Error al generar el QR.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
