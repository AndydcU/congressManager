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
    console.log('📥 Body recibido:', body);
    
    const { competencia_id, puesto, usuario_id, proyecto, descripcion, anio, puntuacion } = body;

    if (!competencia_id || !puesto || !anio) {
      console.error('❌ Faltan campos obligatorios:', { competencia_id, puesto, anio });
      return new Response(JSON.stringify({ error: 'competencia_id, puesto y anio son obligatorios.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (!usuario_id) {
      console.error('❌ Falta usuario_id');
      return new Response(JSON.stringify({ error: 'usuario_id es obligatorio.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    console.log('✅ Datos validados, buscando resultado existente...');

    // Verificar si ya existe un resultado para ese puesto en esa competencia
    const [existente] = await db.query(
      `SELECT id FROM resultados_competencias 
       WHERE competencia_id = ? AND puesto = ? AND anio = ?`,
      [competencia_id, puesto, anio]
    );

    console.log('🔍 Resultado existente:', existente);

    if (existente.length > 0) {
      console.log('🔄 Actualizando resultado existente ID:', existente[0].id);
      // Actualizar el existente
      await db.query(
        `UPDATE resultados_competencias 
         SET usuario_id = ?, proyecto = ?, descripcion = ?
         WHERE id = ?`,
        [usuario_id, proyecto || null, descripcion || null, existente[0].id]
      );
      console.log('✅ Resultado actualizado exitosamente');
      return new Response(JSON.stringify({ id: existente[0].id, updated: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    console.log('➕ Creando nuevo resultado...');
    // Crear nuevo
    const [result] = await db.query(
      `INSERT INTO resultados_competencias (competencia_id, puesto, usuario_id, proyecto, descripcion, anio)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [competencia_id, puesto, usuario_id, proyecto || null, descripcion || null, anio]
    );

    console.log('✅ Resultado creado exitosamente, ID:', result.insertId);
    return new Response(JSON.stringify({ id: result.insertId, created: true }), { status: 201, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('❌ ERROR COMPLETO en POST /api/resultados:', error);
    console.error('Stack trace:', error.stack);
    console.error('Mensaje:', error.message);
    console.error('SQL State:', error.sqlState);
    console.error('SQL Message:', error.sqlMessage);
    return new Response(
      JSON.stringify({ 
        error: 'Error al crear resultado.', 
        details: error.message,
        sqlError: error.sqlMessage || 'Sin detalles SQL'
      }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
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
