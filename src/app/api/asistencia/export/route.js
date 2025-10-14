import db from "@/lib/db";

/* =========================================================
   GET /api/asistencia/export
   Parámetros opcionales:
     - date=YYYY-MM-DD               → exporta registros de ese día
     - from=YYYY-MM-DD&to=YYYY-MM-DD → exporta registros en el rango [from, to]
   Sin parámetros exporta los registros de hoy.

   Respuesta: CSV con columnas
     participante_id,nombre,tipo,fecha_hora
========================================================= */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const date = searchParams.get('date');

    let rows = [];

    if (from && to) {
      const [data] = await db.query(
        `SELECT a.participante_id, p.nombre, p.tipo, a.registrado_en
         FROM asistencia a
         JOIN participantes p ON p.id = a.participante_id
         WHERE DATE(a.registrado_en) BETWEEN ? AND ?
         ORDER BY a.registrado_en DESC`,
        [from, to]
      );
      rows = Array.isArray(data) ? data : [];
    } else if (date) {
      const [data] = await db.query(
        `SELECT a.participante_id, p.nombre, p.tipo, a.registrado_en
         FROM asistencia a
         JOIN participantes p ON p.id = a.participante_id
         WHERE DATE(a.registrado_en) = ?
         ORDER BY a.registrado_en DESC`,
        [date]
      );
      rows = Array.isArray(data) ? data : [];
    } else {
      const [data] = await db.query(
        `SELECT a.participante_id, p.nombre, p.tipo, a.registrado_en
         FROM asistencia a
         JOIN participantes p ON p.id = a.participante_id
         WHERE DATE(a.registrado_en) = CURDATE()
         ORDER BY a.registrado_en DESC`
      );
      rows = Array.isArray(data) ? data : [];
    }

    // Construcción del CSV
    const header = 'participante_id,nombre,tipo,fecha_hora';
    const escape = (val) => {
      if (val === null || val === undefined) return '';
      const s = String(val).replace(/"/g, '""');
      // Si contiene coma, comillas o salto de línea, encerrar en comillas
      if (/[",\n]/.test(s)) return `"${s}"`;
      return s;
    };

    const lines = rows.map(r => [
      escape(r.participante_id),
      escape(r.nombre),
      escape(r.tipo),
      escape(new Date(r.registrado_en).toISOString())
    ].join(','));

    const csv = [header, ...lines].join('\n');

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="asistencia.csv"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error en /api/asistencia/export:', error);
    return new Response(
      JSON.stringify({ error: 'Error al exportar la asistencia.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
