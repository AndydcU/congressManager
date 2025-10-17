import pool from '@/lib/db';

   //GET /api/participantes → Lista todos los usuarios (excepto admins) con sus inscripciones
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const busqueda = searchParams.get('busqueda');

    // Consulta base para obtener usuarios (NO administradores)
    let query = `
      SELECT 
        u.id,
        u.nombre,
        u.correo,
        u.colegio,
        u.telefono,
        u.tipo_usuario as tipo,
        u.carnet,
        u.grado,
        u.creado_en
      FROM usuarios u
      WHERE u.rol = 'usuario'
    `;
    const values = [];

    if (busqueda) {
      query += `
        AND (
          u.nombre LIKE ? OR 
          u.correo LIKE ? OR 
          u.colegio LIKE ? OR 
          u.telefono LIKE ? OR 
          u.carnet LIKE ?
        )
      `;
      const filtro = `%${busqueda}%`;
      values.push(filtro, filtro, filtro, filtro, filtro);
    }

    query += ` ORDER BY u.creado_en DESC`;

    const [usuarios] = await pool.query(query, values);

    // Para cada usuario, obtener sus inscripciones en talleres y competencias (solo activos)
    const usuariosConInscripciones = await Promise.all(
      usuarios.map(async (usuario) => {
        // Obtener talleres inscritos (solo activos)
        const [talleres] = await pool.query(
          `
          SELECT 
            i.id,
            t.id as taller_id,
            t.nombre,
            t.fecha,
            t.hora_inicio,
            t.hora_fin,
            CONCAT(t.hora_inicio, ' - ', t.hora_fin) as horario,
            i.estado,
            i.fecha_inscripcion
          FROM inscripciones i
          INNER JOIN talleres t ON i.taller_id = t.id
          WHERE i.usuario_id = ? AND t.activo = 1
          ORDER BY t.fecha, t.hora_inicio
          `,
          [usuario.id]
        );

        // Obtener competencias inscritas (solo activas)
        const [competencias] = await pool.query(
          `
          SELECT 
            ic.id,
            c.id as competencia_id,
            c.nombre,
            c.fecha,
            c.hora_inicio,
            c.hora_fin,
            CONCAT(c.hora_inicio, ' - ', c.hora_fin) as horario,
            ic.estado,
            ic.registrado_en
          FROM inscripciones_competencias ic
          INNER JOIN competencias c ON ic.competencia_id = c.id
          WHERE ic.usuario_id = ? AND c.activo = 1
          ORDER BY c.fecha, c.hora_inicio
          `,
          [usuario.id]
        );

        return {
          ...usuario,
          talleres: talleres || [],
          competencias: competencias || [],
        };
      })
    );

    return new Response(JSON.stringify(usuariosConInscripciones), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error al obtener participantes:', error);
    return new Response(
      JSON.stringify({ error: 'Error al obtener los participantes.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
