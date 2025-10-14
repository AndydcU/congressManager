import db from "@/lib/db";

/* =========================================================
   Esquema esperado en BD (agregar si no existe):

   CREATE TABLE asistencia_taller (
     id INT AUTO_INCREMENT PRIMARY KEY,
     participante_id INT NOT NULL,
     taller_id INT NOT NULL,
     registrado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     FOREIGN KEY (participante_id) REFERENCES participantes(id) ON DELETE CASCADE,
     FOREIGN KEY (taller_id) REFERENCES talleres(id) ON DELETE CASCADE
   );

   Satisface requerimiento del PDF: asistencia específica por taller/competencia.
========================================================= */

/* =========================================================
   GET /api/asistencia/taller
   Modos:
     - ?taller_id=ID&date=YYYY-MM-DD → lista registros del taller ese día
     - ?date=YYYY-MM-DD → resumen por taller de ese día
     - sin params → resumen por taller de HOY
========================================================= */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const tallerId = searchParams.get('taller_id');
    const date = searchParams.get('date');

    if (tallerId && date) {
      const [rows] = await db.query(
        `SELECT at.id, at.participante_id, p.nombre, at.registrado_en
         FROM asistencia_taller at
         JOIN participantes p ON p.id = at.participante_id
         WHERE at.taller_id = ? AND DATE(at.registrado_en) = ?
         ORDER BY at.registrado_en DESC`,
        [tallerId, date]
      );
      return new Response(JSON.stringify(rows || []), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (date) {
      const [rows] = await db.query(
        `SELECT t.id AS taller_id, t.nombre, COUNT(at.id) AS total
         FROM talleres t
         LEFT JOIN asistencia_taller at
           ON at.taller_id = t.id AND DATE(at.registrado_en) = ?
         GROUP BY t.id, t.nombre
         ORDER BY total DESC, t.nombre ASC`,
        [date]
      );
      return new Response(JSON.stringify(rows || []), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Default: resumen de HOY
    const [rows] = await db.query(
      `SELECT t.id AS taller_id, t.nombre, COUNT(at.id) AS total
       FROM talleres t
       LEFT JOIN asistencia_taller at
         ON at.taller_id = t.id AND DATE(at.registrado_en) = CURDATE()
       GROUP BY t.id, t.nombre
       ORDER BY total DESC, t.nombre ASC`
    );
    return new Response(JSON.stringify(rows || []), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error en GET /api/asistencia/taller:', error);
    return new Response(
      JSON.stringify({ error: 'Error al obtener asistencia por taller. Verifique que la tabla asistencia_taller exista.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/* =========================================================
   POST /api/asistencia/taller
   Body:
     - Con token: { token: string, taller_id: number }
     - Con IDs:   { participante_id: number, taller_id: number }
   Registra una asistencia por taller (1 por día por participante y taller)
========================================================= */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const taller_id = Number(body.taller_id);
    const givenPid = Number(body.participante_id);
    const token = typeof body.token === 'string' ? body.token.trim() : null;

    if (!taller_id || (!givenPid && !token)) {
      return new Response(
        JSON.stringify({ error: 'Faltan parámetros: taller_id y (participante_id o token).' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
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

    // Evitar duplicados en el mismo día por participante y taller
    const [exists] = await db.query(
      `SELECT id FROM asistencia_taller
       WHERE participante_id = ? AND taller_id = ?
         AND DATE(registrado_en) = CURDATE()`,
      [participante_id, taller_id]
    );
    if (Array.isArray(exists) && exists.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Ya registró asistencia hoy para este taller.' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await db.execute(
      'INSERT INTO asistencia_taller (participante_id, taller_id) VALUES (?, ?)',
      [participante_id, taller_id]
    );

    return new Response(
      JSON.stringify({ success: true, participante_id, taller_id }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error en POST /api/asistencia/taller:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
