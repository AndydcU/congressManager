import db from "@/lib/db";

/* =========================================================
   Requiere en BD:
   CREATE TABLE resultados_competencias (
     id INT AUTO_INCREMENT PRIMARY KEY,
     competencia_id INT NOT NULL,
     puesto INT NOT NULL,
     participante_id INT NULL,
     nombre_externo VARCHAR(150) NULL,
     proyecto VARCHAR(200),
     descripcion TEXT,
     foto_url VARCHAR(255),
     anio INT NOT NULL,
     creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     FOREIGN KEY (competencia_id) REFERENCES competencias(id) ON DELETE CASCADE,
     FOREIGN KEY (participante_id) REFERENCES participantes(id) ON DELETE SET NULL
   );
========================================================= */

// GET público → resultados por año (o año actual si no se envia anio)
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const anio = Number(searchParams.get('anio')) || new Date().getFullYear();

    const [rows] = await db.query(
      `SELECT r.id, r.puesto, r.proyecto, r.descripcion, r.foto_url, r.anio,
              c.id AS competencia_id, c.nombre AS competencia,
              r.participante_id, p.nombre AS participante, p.tipo AS tipo_participante
       FROM resultados_competencias r
       JOIN competencias c ON c.id = r.competencia_id
       LEFT JOIN participantes p ON p.id = r.participante_id
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
    const { competencia_id, puesto, participante_id, nombre_externo, proyecto, descripcion, foto_url, anio } = body;

    if (!competencia_id || !puesto || !anio) {
      return new Response(JSON.stringify({ error: 'competencia_id, puesto y anio son obligatorios.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const [result] = await db.query(
      `INSERT INTO resultados_competencias (competencia_id, puesto, participante_id, nombre_externo, proyecto, descripcion, foto_url, anio)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [competencia_id, puesto, participante_id || null, nombre_externo || null, proyecto || null, descripcion || null, foto_url || null, anio]
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
    const { id, competencia_id, puesto, participante_id, nombre_externo, proyecto, descripcion, foto_url, anio } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: 'id es obligatorio.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    await db.query(
      `UPDATE resultados_competencias
       SET competencia_id = COALESCE(?, competencia_id),
           puesto = COALESCE(?, puesto),
           participante_id = ?,
           nombre_externo = ?,
           proyecto = ?,
           descripcion = ?,
           foto_url = ?,
           anio = COALESCE(?, anio)
       WHERE id = ?`,
      [competencia_id, puesto, participante_id || null, nombre_externo || null, proyecto || null, descripcion || null, foto_url || null, anio, id]
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
