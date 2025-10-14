import db from "@/lib/db";

/* =========================================================
   POST /api/asistencia/scan → Registra asistencia usando token seguro
   Body: { token: string }
   Reglas: 1 vez por día por participante
   Respuestas:
     201 → { success: true, participante_id }
     400 → { error }
     404 → { error } (token inválido)
     409 → { error } (asistencia ya registrada hoy)
========================================================= */
export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const token = typeof body.token === 'string' ? body.token.trim() : '';

    if (!token || token.length < 16) {
      return new Response(
        JSON.stringify({ error: 'Falta token válido.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Resolver token → participante_id
    const [parts] = await db.query(
      'SELECT id FROM participantes WHERE qr_token = ? LIMIT 1',
      [token]
    );

    if (!Array.isArray(parts) || parts.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Token inválido.' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const participante_id = parts[0].id;

    // Verificar duplicado del mismo día
    const [existing] = await db.query(
      `SELECT id FROM asistencia
       WHERE participante_id = ?
         AND DATE(registrado_en) = CURDATE()`,
      [participante_id]
    );

    if (Array.isArray(existing) && existing.length > 0) {
      return new Response(
        JSON.stringify({ error: 'El participante ya registró asistencia hoy.' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await db.execute(
      'INSERT INTO asistencia (participante_id) VALUES (?)',
      [participante_id]
    );

    return new Response(
      JSON.stringify({ success: true, participante_id }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error en /api/asistencia/scan:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
