import db from "@/lib/db";

export async function GET(req, { params }) {
  try {
    const { id } = params;

    if (!id) {
      return new Response(
        JSON.stringify({ error: "ID de usuario requerido" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Obtener datos del usuario
    const [usuarios] = await db.query(
      `SELECT 
        id, nombre, correo, telefono, colegio, 
        tipo_usuario, carnet, grado, qr_token, rol, creado_en
       FROM usuarios 
       WHERE id = ?`,
      [id]
    );

    if (!usuarios || usuarios.length === 0) {
      return new Response(
        JSON.stringify({ error: "Usuario no encontrado" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const usuario = usuarios[0];

    // Obtener talleres inscritos (solo activos)
    const [talleres] = await db.query(
      `SELECT 
        i.id,
        i.taller_id,
        t.nombre,
        t.fecha,
        t.hora_inicio,
        t.hora_fin,
        CONCAT(t.hora_inicio, ' - ', t.hora_fin) as horario,
        i.estado,
        i.fecha_inscripcion,
        i.token
      FROM inscripciones i
      INNER JOIN talleres t ON i.taller_id = t.id
      WHERE i.usuario_id = ? AND t.activo = 1
      ORDER BY t.fecha, t.hora_inicio`,
      [id]
    );

    // Obtener competencias inscritas (solo activas)
    const [competencias] = await db.query(
      `SELECT 
        ic.id,
        ic.competencia_id,
        c.nombre,
        c.fecha,
        c.hora_inicio,
        c.hora_fin,
        CONCAT(c.hora_inicio, ' - ', c.hora_fin) as horario,
        ic.estado,
        ic.registrado_en,
        ic.token
      FROM inscripciones_competencias ic
      INNER JOIN competencias c ON ic.competencia_id = c.id
      WHERE ic.usuario_id = ? AND c.activo = 1
      ORDER BY c.fecha, c.hora_inicio`,
      [id]
    );

    // Construir respuesta con inscripciones
    const perfilCompleto = {
      ...usuario,
      talleres: talleres || [],
      competencias: competencias || [],
    };

    return new Response(JSON.stringify(perfilCompleto), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error al obtener perfil de usuario:", error);
    return new Response(
      JSON.stringify({ error: "Error al obtener perfil de usuario" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
