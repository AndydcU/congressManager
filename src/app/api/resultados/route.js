import db from "@/lib/db";

// GET público → resultados por año (o año actual si no se envía anio)
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const anio = Number(searchParams.get('anio')) || new Date().getFullYear();

    const [rows] = await db.query(
      `SELECT r.id, r.puesto, r.proyecto, r.descripcion, r.anio,
              c.id AS competencia_id, c.nombre AS competencia,
              r.usuario_id, u.nombre AS participante, u.tipo_usuario
       FROM resultados_competencias r
       JOIN competencias c ON c.id = r.competencia_id
       LEFT JOIN usuarios u ON u.id = r.usuario_id
       WHERE r.anio = ?
       ORDER BY c.nombre ASC, r.puesto ASC`,
      [anio]
    );

    return new Response(JSON.stringify(rows || []), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error en GET /api/resultados:', error);
    return new Response(JSON.stringify({ error: 'Error al obtener resultados.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

// POST admin → crear resultado
export async function POST(req) {
  try {
    const body = await req.json();
    const { competencia_id, puesto, usuario_id, proyecto, descripcion, anio } = body;

    if (!competencia_id || !puesto || !anio) {
      return new Response(JSON.stringify({ error: 'competencia_id, puesto y anio son obligatorios.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const [result] = await db.query(
      `INSERT INTO resultados_competencias (competencia_id, puesto, usuario_id, proyecto, descripcion, anio)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [competencia_id, puesto, usuario_id || null, proyecto || null, descripcion || null, anio]
    );

    return new Response(JSON.stringify({ id: result.insertId }), { status: 201, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error en POST /api/resultados:', error);
    return new Response(JSON.stringify({ error: 'Error al crear resultado.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

// PUT admin → actualizar resultado
export async function PUT(req) {
  try {
    const body = await req.json();
    const { id, competencia_id, puesto, usuario_id, proyecto, descripcion, anio } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: 'id es obligatorio.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    await db.query(
      `UPDATE resultados_competencias
       SET competencia_id = COALESCE(?, competencia_id),
           puesto = COALESCE(?, puesto),
           usuario_id = ?,
           proyecto = ?,
           descripcion = ?,
           anio = COALESCE(?, anio)
       WHERE id = ?`,
      [competencia_id, puesto, usuario_id || null, proyecto || null, descripcion || null, anio, id]
    );

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error en PUT /api/resultados:', error);
    return new Response(JSON.stringify({ error: 'Error al actualizar resultado.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

// DELETE admin → eliminar resultado
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get('id'));
    if (!id) {
      return new Response(JSON.stringify({ error: 'id es obligatorio.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    await db.query('DELETE FROM resultados_competencias WHERE id = ?', [id]);
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error en DELETE /api/resultados:', error);
    return new Response(JSON.stringify({ error: 'Error al eliminar resultado.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
