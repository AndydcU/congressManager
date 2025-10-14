import db from "@/lib/db";


export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const competenciaId = searchParams.get('competencia_id');
    const date = searchParams.get('date');

    if (competenciaId && date) {
      const [rows] = await db.query(
        `SELECT ac.id, ac.participante_id, p.nombre, ac.registrado_en
         FROM asistencia_competencia ac
         JOIN participantes p ON p.id = ac.participante_id
         WHERE ac.competencia_id = ? AND DATE(ac.registrado_en) = ?
         ORDER BY ac.registrado_en DESC`,
        [competenciaId, date]
      );
      return new Response(JSON.stringify(rows || []), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (date) {
      const [rows] = await db.query(
        `SELECT c.id AS competencia_id, c.nombre, COUNT(ac.id) AS total
         FROM competencias c
         LEFT JOIN asistencia_competencia ac
           ON ac.competencia_id = c.id AND DATE(ac.registrado_en) = ?
         GROUP BY c.id, c.nombre
         ORDER BY total DESC, c.nombre ASC`,
        [date]
      );
      return new Response(JSON.stringify(rows || []), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Default: resumen de HOY
    const [rows] = await db.query(
      `SELECT c.id AS competencia_id, c.nombre, COUNT(ac.id) AS total
       FROM competencias c
       LEFT JOIN asistencia_competencia ac
         ON ac.competencia_id = c.id AND DATE(ac.registrado_en) = CURDATE()
       GROUP BY c.id, c.nombre
       ORDER BY total DESC, c.nombre ASC`
    );
    return new Response(JSON.stringify(rows || []), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error en GET /api/asistencia/competencia:', error);
    return new Response(
      JSON.stringify({ error: 'Error al obtener asistencia por competencia. Verifique que la tabla asistencia_competencia exista.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/* =========================================================
   POST /api/asistencia/competencia
   Body:
     - Con token: { token: string, competencia_id: number }
     - Con IDs:   { participante_id: number, competencia_id: number }
   Registra asistencia por competencia (1 vez por día por participante y competencia)
========================================================= */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const competencia_id = Number(body.competencia_id);
    const givenPid = Number(body.participante_id);
    const token = typeof body.token === 'string' ? body.token.trim() : null;

    if (!competencia_id || (!givenPid && !token)) {
      return new Response(
        JSON.stringify({ error: 'Faltan parámetros: competencia_id y (participante_id o token).' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar existencia de competencia
    const [comp] = await db.query('SELECT id FROM competencias WHERE id = ? LIMIT 1', [competencia_id]);
    if (!Array.isArray(comp) || comp.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Competencia no encontrada.' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let participante_id = givenPid || null;

    if (!participante_id && token) {
      const [rows] = await db.query(
        'SELECT id FROM participantes WHERE qr_token = ? LIMIT 1',
        [token]
      );
      if (!Array.isArray(rows) || rows.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Token inválido.' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
      participante_id = rows[0].id;
    }

    // Evitar duplicados en el mismo día por participante y competencia
    const [exists] = await db.query(
      `SELECT id FROM asistencia_competencia
       WHERE participante_id = ? AND competencia_id = ?
         AND DATE(registrado_en) = CURDATE()`,
      [participante_id, competencia_id]
    );
    if (Array.isArray(exists) && exists.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Ya registró asistencia hoy para esta competencia.' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await db.execute(
      'INSERT INTO asistencia_competencia (participante_id, competencia_id) VALUES (?, ?)',
      [participante_id, competencia_id]
    );

    return new Response(
      JSON.stringify({ success: true, participante_id, competencia_id }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error en POST /api/asistencia/competencia:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
