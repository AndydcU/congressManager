import db from "@/lib/db";

/* =========================================================
   POST /api/asistencia/scan → Registra asistencia usando QR
   Body: { usuario_id, tipo, id, timestamp } (parseado del QR)
   
   Tipos de asistencia:
   - tipo: 'taller' → id es taller_id
   - tipo: 'competencia' → id es competencia_id
   
   Respuestas:
     201 → { success: true, mensaje }
     400 → { error }
     404 → { error } (usuario o inscripción no encontrada)
     409 → { error } (asistencia ya registrada)
========================================================= */
export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Código QR inválido. No se pudo identificar el participante.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { usuario_id, tipo, id, timestamp } = body;

    // Validar datos requeridos
    if (!usuario_id || !tipo || !id) {
      return new Response(
        JSON.stringify({ error: 'Código QR inválido. Faltan datos requeridos.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validar tipo
    if (!['taller', 'competencia'].includes(tipo)) {
      return new Response(
        JSON.stringify({ error: 'Tipo de actividad inválido.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar que el usuario existe
    const [usuarios] = await db.query(
      'SELECT id, nombre FROM usuarios WHERE id = ? LIMIT 1',
      [usuario_id]
    );

    if (!Array.isArray(usuarios) || usuarios.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Usuario no encontrado.' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const usuario = usuarios[0];

    // Verificar que el usuario está inscrito en la actividad
    if (tipo === 'taller') {
      const [inscripcion] = await db.query(
        'SELECT id FROM inscripciones WHERE usuario_id = ? AND taller_id = ? LIMIT 1',
        [usuario_id, id]
      );

      if (!Array.isArray(inscripcion) || inscripcion.length === 0) {
        return new Response(
          JSON.stringify({ error: 'El usuario no está inscrito en este taller.' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } else if (tipo === 'competencia') {
      const [inscripcion] = await db.query(
        'SELECT id FROM inscripciones_competencias WHERE usuario_id = ? AND competencia_id = ? LIMIT 1',
        [usuario_id, id]
      );

      if (!Array.isArray(inscripcion) || inscripcion.length === 0) {
        return new Response(
          JSON.stringify({ error: 'El usuario no está inscrito en esta competencia.' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Verificar si ya registró asistencia para esta actividad específica hoy
    const [existente] = await db.query(
      `SELECT id FROM asistencia_general
       WHERE usuario_id = ?
         AND tipo = ?
         AND actividad_id = ?
         AND DATE(registrado_en) = CURDATE()
       LIMIT 1`,
      [usuario_id, tipo, id]
    );

    if (Array.isArray(existente) && existente.length > 0) {
      return new Response(
        JSON.stringify({ 
          error: `${usuario.nombre} ya registró asistencia para este ${tipo} hoy.` 
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Registrar asistencia
    await db.execute(
      'INSERT INTO asistencia_general (usuario_id, tipo, actividad_id) VALUES (?, ?, ?)',
      [usuario_id, tipo, id]
    );

    return new Response(
      JSON.stringify({ 
        success: true, 
        mensaje: `Asistencia registrada exitosamente para ${usuario.nombre}.`,
        usuario: usuario.nombre
      }),
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
