import db from "@/lib/db";

/* =========================================================
   GET /api/asistencia/report
   Parámetros soportados:
     - date=YYYY-MM-DD        → resumen para esa fecha (si no se envía, usa hoy)
     - from=YYYY-MM-DD&to=YYYY-MM-DD → desglose por día en rango [from, to]

   Respuestas:
     - Con from/to: [{ fecha, total, internos, externos }]
     - Con date (o default hoy): { fecha, total, internos, externos }
========================================================= */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const date = searchParams.get('date');

    if (from && to) {
      const [rows] = await db.query(
        `SELECT 
           DATE(a.registrado_en) AS fecha,
           COUNT(*) AS total,
           SUM(CASE WHEN p.tipo = 'interno' THEN 1 ELSE 0 END) AS internos,
           SUM(CASE WHEN p.tipo = 'externo' THEN 1 ELSE 0 END) AS externos
         FROM asistencia a
         JOIN participantes p ON p.id = a.participante_id
         WHERE DATE(a.registrado_en) BETWEEN ? AND ?
         GROUP BY DATE(a.registrado_en)
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
           SUM(CASE WHEN p.tipo = 'interno' THEN 1 ELSE 0 END) AS internos,
           SUM(CASE WHEN p.tipo = 'externo' THEN 1 ELSE 0 END) AS externos
         FROM asistencia a
         JOIN participantes p ON p.id = a.participante_id
         WHERE DATE(a.registrado_en) = ?`,
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
         SUM(CASE WHEN p.tipo = 'interno' THEN 1 ELSE 0 END) AS internos,
         SUM(CASE WHEN p.tipo = 'externo' THEN 1 ELSE 0 END) AS externos
       FROM asistencia a
       JOIN participantes p ON p.id = a.participante_id
       WHERE DATE(a.registrado_en) = CURDATE()`
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
