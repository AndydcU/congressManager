import db from "@/lib/db";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const date = searchParams.get('date');

    if (from && to) {
      const [rows] = await db.query(
        `SELECT 
           DATE(ag.registrado_en) AS fecha,
           COUNT(*) AS total,
           SUM(CASE WHEN u.tipo_usuario = 'interno' THEN 1 ELSE 0 END) AS internos,
           SUM(CASE WHEN u.tipo_usuario = 'externo' THEN 1 ELSE 0 END) AS externos
         FROM asistencia_general ag
         JOIN usuarios u ON u.id = ag.usuario_id
         WHERE DATE(ag.registrado_en) BETWEEN ? AND ?
         GROUP BY DATE(ag.registrado_en)
         ORDER BY fecha DESC`,
        [from, to]
      );

      return new Response(JSON.stringify(rows), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Resumen de un día (date o hoy)
    if (date) {
      const [rows] = await db.query(
        `SELECT 
           COUNT(*) AS total,
           SUM(CASE WHEN u.tipo_usuario = 'interno' THEN 1 ELSE 0 END) AS internos,
           SUM(CASE WHEN u.tipo_usuario = 'externo' THEN 1 ELSE 0 END) AS externos
         FROM asistencia_general ag
         JOIN usuarios u ON u.id = ag.usuario_id
         WHERE DATE(ag.registrado_en) = ?`,
        [date]
      );

      const agg = Array.isArray(rows) && rows[0] ? rows[0] : { total: 0, internos: 0, externos: 0 };
      return new Response(JSON.stringify({ fecha: date, ...agg }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Default: hoy
    const [rows] = await db.query(
      `SELECT 
         COUNT(*) AS total,
         SUM(CASE WHEN u.tipo_usuario = 'interno' THEN 1 ELSE 0 END) AS internos,
         SUM(CASE WHEN u.tipo_usuario = 'externo' THEN 1 ELSE 0 END) AS externos
       FROM asistencia_general ag
       JOIN usuarios u ON u.id = ag.usuario_id
       WHERE DATE(ag.registrado_en) = CURDATE()`
    );

    const today = new Date();
    const fecha = today.toISOString().slice(0, 10);
    const agg = Array.isArray(rows) && rows[0] ? rows[0] : { total: 0, internos: 0, externos: 0 };

    return new Response(JSON.stringify({ fecha, ...agg }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error en /api/asistencia/report:', error);
    return new Response(
      JSON.stringify({ error: 'Error al generar el reporte.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
