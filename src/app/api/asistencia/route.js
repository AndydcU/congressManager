import db from "@/lib/db";

export async function GET() {
  try {
    const [rows] = await db.query(`
      SELECT 
        ag.id,
        ag.usuario_id,
        u.nombre,
        u.tipo_usuario as tipo_participante,
        ag.tipo as tipo_actividad,
        ag.actividad_id,
        CASE 
          WHEN ag.tipo = 'taller' THEN t.nombre
          WHEN ag.tipo = 'competencia' THEN c.nombre
          ELSE 'Asistencia General'
        END as actividad,
        ag.registrado_en
      FROM asistencia_general ag
      JOIN usuarios u ON u.id = ag.usuario_id
      LEFT JOIN talleres t ON ag.tipo = 'taller' AND t.id = ag.actividad_id
      LEFT JOIN competencias c ON ag.tipo = 'competencia' AND c.id = ag.actividad_id
      ORDER BY ag.registrado_en DESC
    `);

    return new Response(JSON.stringify(rows), {
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

export async function POST(request) {
  const { usuario_id, tipo, actividad_id } = await request.json();

  if (!usuario_id || !tipo) {
    return new Response(
      JSON.stringify({ error: 'Faltan datos obligatorios (usuario_id y tipo).' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Validar que el tipo sea válido
  if (!['general', 'taller', 'competencia'].includes(tipo)) {
    return new Response(
      JSON.stringify({ error: 'Tipo de asistencia inválido.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Si es taller o competencia, se requiere actividad_id
  if ((tipo === 'taller' || tipo === 'competencia') && !actividad_id) {
    return new Response(
      JSON.stringify({ error: 'Se requiere actividad_id para asistencia de taller o competencia.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Obtener info del usuario
    const [usuario] = await db.query(
      "SELECT nombre FROM usuarios WHERE id = ?",
      [usuario_id]
    );

    if (!usuario || usuario.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Usuario no encontrado.' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const nombre = usuario[0].nombre;
    let actividad = null;

    // Validar actividad si corresponde
    if (tipo === 'taller' && actividad_id) {
      const [taller] = await db.query("SELECT nombre FROM talleres WHERE id = ?", [actividad_id]);
      if (!taller || taller.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Taller no encontrado.' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
      actividad = taller[0].nombre;
    } else if (tipo === 'competencia' && actividad_id) {
      const [competencia] = await db.query("SELECT nombre FROM competencias WHERE id = ?", [actividad_id]);
      if (!competencia || competencia.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Competencia no encontrada.' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
      actividad = competencia[0].nombre;
    }

    // Verificar si ya registró asistencia hoy para esta actividad/tipo
    const [existing] = await db.query(
      `SELECT id FROM asistencia_general 
       WHERE usuario_id = ? 
       AND tipo = ? 
       AND (actividad_id = ? OR (actividad_id IS NULL AND ? IS NULL))
       AND DATE(registrado_en) = CURDATE()`,
      [usuario_id, tipo, actividad_id || null, actividad_id || null]
    );

    if (existing.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Ya registró asistencia para esta actividad hoy.' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Registrar asistencia
    await db.execute(
      'INSERT INTO asistencia_general (usuario_id, tipo, actividad_id) VALUES (?, ?, ?)',
      [usuario_id, tipo, actividad_id || null]
    );

    return new Response(
      JSON.stringify({ 
        success: true, 
        nombre,
        actividad,
        tipo
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error al registrar asistencia:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
