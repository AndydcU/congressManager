// src/app/api/asistencia/route.js
import db from "@/lib/db";

/* =========================================================
   GET /api/asistencia → Lista todas las asistencias
   Ahora incluye información de talleres y competencias
   ========================================================= */
export async function GET() {
  try {
    // Get general attendance (old system, for backwards compatibility)
    const [generalRows] = await db.query(`
      SELECT 
        a.id,
        a.participante_id,
        p.nombre,
        p.tipo as tipo_participante,
        NULL as actividad,
        NULL as tipo_actividad,
        a.registrado_en
      FROM asistencia a
      JOIN participantes p ON p.id = a.participante_id
      ORDER BY a.registrado_en DESC
    `);

    // Get workshop attendance
    const [tallerRows] = await db.query(`
      SELECT 
        at.id,
        at.participante_id,
        p.nombre,
        p.tipo as tipo_participante,
        t.nombre as actividad,
        'taller' as tipo_actividad,
        at.registrado_en
      FROM asistencia_talleres at
      JOIN participantes p ON p.id = at.participante_id
      JOIN talleres t ON t.id = at.taller_id
      ORDER BY at.registrado_en DESC
    `);

    // Get competition attendance
    const [competenciaRows] = await db.query(`
      SELECT 
        ac.id,
        ac.participante_id,
        p.nombre,
        p.tipo as tipo_participante,
        c.nombre as actividad,
        'competencia' as tipo_actividad,
        ac.registrado_en
      FROM asistencia_competencias ac
      JOIN participantes p ON p.id = ac.participante_id
      JOIN competencias c ON c.id = ac.competencia_id
      ORDER BY ac.registrado_en DESC
    `);

    // Combine all attendance records
    const allRows = [
      ...(Array.isArray(generalRows) ? generalRows : []),
      ...(Array.isArray(tallerRows) ? tallerRows : []),
      ...(Array.isArray(competenciaRows) ? competenciaRows : [])
    ];

    // Sort by date
    allRows.sort((a, b) => new Date(b.registrado_en) - new Date(a.registrado_en));

    return new Response(JSON.stringify(allRows), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error al obtener asistencias:', error);
    return new Response(
      JSON.stringify({ error: 'Error al obtener las asistencias.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/* =========================================================
   POST /api/asistencia → Registra una asistencia
   Ahora soporta tipo y id para talleres/competencias específicas
   ========================================================= */
export async function POST(request) {
  const { participante_id, tipo, id } = await request.json();

  // ⚠️ Validar que se envíe el ID
  if (!participante_id) {
    return new Response(
      JSON.stringify({ error: 'Falta participante_id.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Get participant info
    const [participante] = await db.query(
      "SELECT nombre FROM participantes WHERE id = ?",
      [participante_id]
    );

    if (!participante || participante.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Participante no encontrado.' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const nombre = participante[0].nombre;
    let actividad = null;

    // If tipo and id are provided, register specific workshop/competition attendance
    if (tipo && id) {
      if (tipo === 'taller') {
        // Check if workshop exists
        const [taller] = await db.query("SELECT nombre FROM talleres WHERE id = ?", [id]);
        if (!taller || taller.length === 0) {
          return new Response(
            JSON.stringify({ error: 'Taller no encontrado.' }),
            { status: 404, headers: { 'Content-Type': 'application/json' } }
          );
        }
        actividad = taller[0].nombre;

        // Check for duplicate
        const [existing] = await db.query(
          "SELECT id FROM asistencia_talleres WHERE participante_id = ? AND taller_id = ? AND DATE(registrado_en) = CURDATE()",
          [participante_id, id]
        );

        if (existing.length > 0) {
          return new Response(
            JSON.stringify({ error: 'Ya registró asistencia a este taller hoy.' }),
            { status: 409, headers: { 'Content-Type': 'application/json' } }
          );
        }

        // Register attendance
        await db.execute(
          'INSERT INTO asistencia_talleres (participante_id, taller_id) VALUES (?, ?)',
          [participante_id, id]
        );

      } else if (tipo === 'competencia') {
        // Check if competition exists
        const [competencia] = await db.query("SELECT nombre FROM competencias WHERE id = ?", [id]);
        if (!competencia || competencia.length === 0) {
          return new Response(
            JSON.stringify({ error: 'Competencia no encontrada.' }),
            { status: 404, headers: { 'Content-Type': 'application/json' } }
          );
        }
        actividad = competencia[0].nombre;

        // Check for duplicate
        const [existing] = await db.query(
          "SELECT id FROM asistencia_competencias WHERE participante_id = ? AND competencia_id = ? AND DATE(registrado_en) = CURDATE()",
          [participante_id, id]
        );

        if (existing.length > 0) {
          return new Response(
            JSON.stringify({ error: 'Ya registró asistencia a esta competencia hoy.' }),
            { status: 409, headers: { 'Content-Type': 'application/json' } }
          );
        }

        // Register attendance
        await db.execute(
          'INSERT INTO asistencia_competencias (participante_id, competencia_id) VALUES (?, ?)',
          [participante_id, id]
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          nombre,
          actividad,
          tipo
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      );

    } else {
      // General attendance (old system, for backwards compatibility)
      const [existing] = await db.query(
        "SELECT id FROM asistencia WHERE participante_id = ? AND DATE(registrado_en) = CURDATE()",
        [participante_id]
      );

      if (existing.length > 0) {
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
        JSON.stringify({ success: true, nombre }),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error al registrar asistencia:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
