import db from "@/lib/db";

/**
 * GET /api/diplomas/diagnostico
 * Diagnostica por qué no se están generando diplomas
 */
export async function GET(req) {
  try {
    const diagnostico = {
      timestamp: new Date().toISOString(),
      environment: {
        isVercel: process.env.VERCEL === '1',
        hasBlobToken: !!process.env.BLOB_READ_WRITE_TOKEN,
        nodeEnv: process.env.NODE_ENV
      },
      competencias: [],
      ganadores: [],
      asistencias: [],
      diplomasExistentes: []
    };

    // 1. Verificar competencias finalizadas
    const anioActual = new Date().getFullYear();
    const [competencias] = await db.query(`
      SELECT 
        c.id, 
        c.nombre, 
        c.fecha, 
        c.hora_fin,
        c.activo,
        CONCAT(c.fecha, ' ', c.hora_fin) as fecha_hora_fin,
        NOW() as ahora,
        CONCAT(c.fecha, ' ', c.hora_fin) < NOW() as finalizada
      FROM competencias c
      WHERE c.activo = 1
      ORDER BY c.fecha DESC
    `);

    diagnostico.competencias = competencias;

    // 2. Verificar ganadores registrados
    const [ganadores] = await db.query(`
      SELECT 
        r.id,
        r.usuario_id,
        r.puesto,
        r.competencia_id,
        r.anio,
        u.nombre as usuario_nombre,
        c.nombre as competencia_nombre,
        c.fecha,
        c.hora_fin,
        CONCAT(c.fecha, ' ', c.hora_fin) < NOW() as competencia_finalizada
      FROM resultados_competencias r
      JOIN usuarios u ON u.id = r.usuario_id
      JOIN competencias c ON c.id = r.competencia_id
      WHERE r.anio = ?
      ORDER BY r.competencia_id, r.puesto
    `, [anioActual]);

    diagnostico.ganadores = ganadores;

    // 3. Verificar asistencias de ganadores
    if (ganadores.length > 0) {
      const usuarioIds = ganadores.map(g => g.usuario_id);
      const competenciaIds = [...new Set(ganadores.map(g => g.competencia_id))];
      
      const [asistencias] = await db.query(`
        SELECT 
          ag.usuario_id,
          ag.actividad_id as competencia_id,
          ag.tipo,
          ag.registrado_en,
          u.nombre as usuario_nombre,
          c.nombre as competencia_nombre
        FROM asistencia_general ag
        JOIN usuarios u ON u.id = ag.usuario_id
        JOIN competencias c ON c.id = ag.actividad_id
        WHERE ag.tipo = 'competencia'
          AND ag.usuario_id IN (?)
          AND ag.actividad_id IN (?)
      `, [usuarioIds, competenciaIds]);

      diagnostico.asistencias = asistencias;
    }

    // 4. Verificar diplomas ya existentes
    const [diplomas] = await db.query(`
      SELECT 
        d.id,
        d.usuario_id,
        d.tipo,
        d.competencia_id,
        d.codigo_verificacion,
        d.archivo_url,
        d.emitido_en,
        u.nombre as usuario_nombre,
        c.nombre as competencia_nombre
      FROM diplomas d
      JOIN usuarios u ON u.id = d.usuario_id
      LEFT JOIN competencias c ON c.id = d.competencia_id
      WHERE d.tipo = 'competencia'
      ORDER BY d.emitido_en DESC
      LIMIT 20
    `);

    diagnostico.diplomasExistentes = diplomas;

    // 5. Análisis
    diagnostico.analisis = {
      totalCompetencias: competencias.length,
      competenciasFinalizadas: competencias.filter(c => c.finalizada).length,
      totalGanadores: ganadores.length,
      ganadoresConAsistencia: diagnostico.asistencias.length,
      ganadoresSinAsistencia: ganadores.filter(g => 
        !diagnostico.asistencias.some(a => 
          a.usuario_id === g.usuario_id && a.competencia_id === g.competencia_id
        )
      ),
      totalDiplomasGenerados: diplomas.length,
      ganadoresSinDiploma: ganadores.filter(g => 
        !diplomas.some(d => 
          d.usuario_id === g.usuario_id && 
          d.competencia_id === g.competencia_id &&
          d.codigo_verificacion.includes('LUGAR')
        )
      )
    };

    return new Response(
      JSON.stringify(diagnostico, null, 2), 
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error en diagnóstico:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Error en diagnóstico',
        details: error.message,
        stack: error.stack
      }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * POST /api/diplomas/diagnostico
 * Fuerza la generación de diplomas de ganadores
 */
export async function POST(req) {
  try {
    const { searchParams } = new URL(req.url);
    const force = searchParams.get('force') === 'true';

    if (!force) {
      return new Response(
        JSON.stringify({ 
          error: 'Usar ?force=true para forzar generación',
          info: 'Esto generará diplomas para todos los ganadores sin diploma'
        }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Llamar al endpoint de verificar y generar
    const baseUrl = req.headers.get('host');
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const url = `${protocol}://${baseUrl}/api/diplomas/verificar-y-generar`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await response.json();

    return new Response(
      JSON.stringify(data), 
      { 
        status: response.ok ? 200 : 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error forzando generación:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Error forzando generación',
        details: error.message
      }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
