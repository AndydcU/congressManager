import db from "@/lib/db";
import { generarDiplomaPDF } from "@/lib/diplomaGenerator";
import crypto from 'crypto';

/**
 * POST /api/diplomas/verificar-y-generar
 * Verifica actividades finalizadas y genera diplomas automáticamente
 * Este endpoint debe ser llamado periódicamente para automatizar la generación
 */
export async function POST(req) {
  try {
    const diplomasGenerados = [];
    const errores = [];

    console.log('Verificando actividades finalizadas...');

    try {
      const [talleres] = await db.query(`
        SELECT t.id, t.nombre, t.fecha, t.hora_fin
        FROM talleres t
        WHERE t.activo = 1
          AND t.fecha IS NOT NULL
          AND t.hora_fin IS NOT NULL
          AND CONCAT(t.fecha, ' ', t.hora_fin) < NOW()
      `);

      console.log(`Talleres finalizados: ${talleres.length}`);

      for (const taller of talleres) {
        const [asistentes] = await db.query(`
          SELECT DISTINCT u.id, u.nombre, u.correo
          FROM asistencia_general ag
          JOIN usuarios u ON u.id = ag.usuario_id
          WHERE ag.tipo = 'taller' 
            AND ag.actividad_id = ?
            AND NOT EXISTS (
              SELECT 1 FROM diplomas d 
              WHERE d.usuario_id = u.id 
                AND d.tipo = 'taller' 
                AND d.taller_id = ?
            )
        `, [taller.id, taller.id]);

        if (asistentes.length > 0) {
          console.log(`Taller "${taller.nombre}": ${asistentes.length} diplomas pendientes`);
        }

        for (const asistente of asistentes) {
          try {
            const resultado = await generarYGuardarDiploma({
              usuario_id: asistente.id,
              usuario_nombre: asistente.nombre,
              usuario_correo: asistente.correo,
              tipo: 'taller',
              taller_id: taller.id,
              titulo: `Por su participación en el taller: ${taller.nombre}`,
              subtitulo: taller.fecha ? `Realizado el ${new Date(taller.fecha).toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' })}` : null
            });
            diplomasGenerados.push(resultado);
          } catch (err) {
            console.error(`Error generando diploma para ${asistente.nombre}:`, err.message);
            errores.push({ tipo: 'taller', usuario: asistente.nombre, error: err.message });
          }
        }
      }
    } catch (err) {
      console.error('Error procesando talleres:', err);
      errores.push({ tipo: 'talleres_general', error: err.message });
    }

    try {
      const [competencias] = await db.query(`
        SELECT c.id, c.nombre, c.fecha, c.hora_fin
        FROM competencias c
        WHERE c.activo = 1
          AND c.fecha IS NOT NULL
          AND c.hora_fin IS NOT NULL
          AND CONCAT(c.fecha, ' ', c.hora_fin) < NOW()
      `);

      console.log(`Competencias finalizadas: ${competencias.length}`);

      for (const competencia of competencias) {
        const [asistentes] = await db.query(`
          SELECT DISTINCT u.id, u.nombre, u.correo
          FROM asistencia_general ag
          JOIN usuarios u ON u.id = ag.usuario_id
          WHERE ag.tipo = 'competencia' 
            AND ag.actividad_id = ?
            AND NOT EXISTS (
              SELECT 1 FROM diplomas d 
              WHERE d.usuario_id = u.id 
                AND d.tipo = 'competencia' 
                AND d.competencia_id = ?
                AND d.codigo_verificacion NOT LIKE '%LUGAR%'
            )
        `, [competencia.id, competencia.id]);

        if (asistentes.length > 0) {
          console.log(`Competencia "${competencia.nombre}": ${asistentes.length} diplomas pendientes`);
        }

        for (const asistente of asistentes) {
          try {
            const resultado = await generarYGuardarDiploma({
              usuario_id: asistente.id,
              usuario_nombre: asistente.nombre,
              usuario_correo: asistente.correo,
              tipo: 'competencia',
              competencia_id: competencia.id,
              titulo: `Por su participación en la competencia: ${competencia.nombre}`,
              subtitulo: competencia.fecha ? `Realizada el ${new Date(competencia.fecha).toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' })}` : null
            });
            diplomasGenerados.push(resultado);
          } catch (err) {
            console.error(`Error generando diploma para ${asistente.nombre}:`, err.message);
            errores.push({ tipo: 'competencia', usuario: asistente.nombre, error: err.message });
          }
        }
      }
    } catch (err) {
      console.error('Error procesando competencias:', err);
      errores.push({ tipo: 'competencias_general', error: err.message });
    }

    try {
      const anioActual = new Date().getFullYear();
      
      // Obtener competencias finalizadas con resultados
      const [competenciasConResultados] = await db.query(`
        SELECT DISTINCT c.id, c.fecha, c.hora_fin
        FROM competencias c
        INNER JOIN resultados_competencias r ON r.competencia_id = c.id
        WHERE c.activo = 1
          AND c.fecha IS NOT NULL
          AND c.hora_fin IS NOT NULL
          AND CONCAT(c.fecha, ' ', c.hora_fin) < NOW()
          AND r.anio = ?
      `, [anioActual]);

      console.log(`Competencias con resultados: ${competenciasConResultados.length}`);

      for (const comp of competenciasConResultados) {
        const [ganadores] = await db.query(`
          SELECT 
            r.id, r.usuario_id, r.puesto, r.competencia_id,
            u.nombre as usuario_nombre, u.correo as usuario_correo,
            c.nombre as competencia_nombre, c.fecha
          FROM resultados_competencias r
          JOIN usuarios u ON u.id = r.usuario_id
          JOIN competencias c ON c.id = r.competencia_id
          WHERE r.competencia_id = ?
            AND r.anio = ?
            AND r.puesto <= 3
            AND NOT EXISTS (
              SELECT 1 FROM diplomas d
              WHERE d.usuario_id = r.usuario_id
                AND d.tipo = 'competencia'
                AND d.competencia_id = r.competencia_id
                AND (
                  d.codigo_verificacion LIKE '%PRIMERLUGAR%' OR
                  d.codigo_verificacion LIKE '%SEGUNDOLUGAR%' OR
                  d.codigo_verificacion LIKE '%TERCERLUGAR%'
                )
            )
        `, [comp.id, anioActual]);

        if (ganadores.length > 0) {
          console.log(`Ganadores sin diploma: ${ganadores.length}`);
        }

        for (const ganador of ganadores) {
          try {
            const puestoTexto = ganador.puesto === 1 ? 'PRIMER' : ganador.puesto === 2 ? 'SEGUNDO' : 'TERCER';
            
            const resultado = await generarYGuardarDiploma({
              usuario_id: ganador.usuario_id,
              usuario_nombre: ganador.usuario_nombre,
              usuario_correo: ganador.usuario_correo,
              tipo: 'competencia',
              competencia_id: ganador.competencia_id,
              titulo: `RECONOCIMIENTO - ${puestoTexto} LUGAR`,
              subtitulo: `Competencia: ${ganador.competencia_nombre}`,
              descripcion: `Por su destacada participacion obteniendo el ${puestoTexto.toLowerCase()} lugar`,
              codigo_extra: `${puestoTexto}LUGAR`
            });
            diplomasGenerados.push(resultado);
          } catch (err) {
            console.error(`Error generando diploma de ganador:`, err.message);
            errores.push({ tipo: 'ganador', usuario: ganador.usuario_nombre, error: err.message });
          }
        }
      }
    } catch (err) {
      console.error('Error procesando ganadores:', err);
      errores.push({ tipo: 'ganadores_general', error: err.message });
    }

    console.log(`Proceso completado. Diplomas generados: ${diplomasGenerados.length}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        generados: diplomasGenerados.length,
        diplomas: diplomasGenerados,
        errores: errores.length > 0 ? errores : undefined,
        timestamp: new Date().toISOString()
      }), 
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error en verificación automática:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Error al verificar y generar diplomas automáticamente.',
        details: error.message 
      }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * GET - Permite verificar el estado sin generar diplomas
 */
export async function GET(req) {
  try {
    const [talleresPendientes] = await db.query(`
      SELECT COUNT(DISTINCT ag.usuario_id) as total
      FROM asistencia_general ag
      JOIN talleres t ON t.id = ag.actividad_id
      WHERE ag.tipo = 'taller'
        AND t.activo = 1
        AND t.fecha IS NOT NULL
        AND t.hora_fin IS NOT NULL
        AND CONCAT(t.fecha, ' ', t.hora_fin) < NOW()
        AND NOT EXISTS (
          SELECT 1 FROM diplomas d 
          WHERE d.usuario_id = ag.usuario_id 
            AND d.tipo = 'taller' 
            AND d.taller_id = ag.actividad_id
        )
    `);

    const [competenciasPendientes] = await db.query(`
      SELECT COUNT(DISTINCT ag.usuario_id) as total
      FROM asistencia_general ag
      JOIN competencias c ON c.id = ag.actividad_id
      WHERE ag.tipo = 'competencia'
        AND c.activo = 1
        AND c.fecha IS NOT NULL
        AND c.hora_fin IS NOT NULL
        AND CONCAT(c.fecha, ' ', c.hora_fin) < NOW()
        AND NOT EXISTS (
          SELECT 1 FROM diplomas d 
          WHERE d.usuario_id = ag.usuario_id 
            AND d.tipo = 'competencia' 
            AND d.competencia_id = ag.actividad_id
            AND d.codigo_verificacion NOT LIKE '%LUGAR%'
        )
    `);

    return new Response(
      JSON.stringify({ 
        pendientes: {
          talleres: talleresPendientes[0]?.total || 0,
          competencias: competenciasPendientes[0]?.total || 0
        }
      }), 
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error verificando diplomas pendientes:', error);
    return new Response(
      JSON.stringify({ error: 'Error al verificar estado' }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function generarYGuardarDiploma({ 
  usuario_id, 
  usuario_nombre, 
  usuario_correo,
  tipo, 
  taller_id = null, 
  competencia_id = null, 
  titulo, 
  subtitulo = null,
  descripcion = null,
  codigo_extra = ''
}) {
  // Generar PDF
  const pdfBuffer = await generarDiplomaPDF({
    nombreParticipante: usuario_nombre,
    titulo,
    subtitulo,
    descripcion
  });

  // Guardar archivo
  const filename = `${crypto.randomBytes(16).toString('hex')}.pdf`;
  const filepath = `/diplomas/${filename}`;
  
  const fs = require('fs').promises;
  const path = require('path');
  const dir = path.join(process.cwd(), 'public', 'diplomas');
  
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
  
  await fs.writeFile(path.join(process.cwd(), 'public', filepath), pdfBuffer);

  // Código de verificación único
  const codigo_verificacion = `${tipo.toUpperCase()}-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}${codigo_extra ? `-${codigo_extra}` : ''}`;

  // Guardar en base de datos
  const [result] = await db.query(
    `INSERT INTO diplomas (usuario_id, tipo, taller_id, competencia_id, archivo_url, codigo_verificacion, enviado)
     VALUES (?, ?, ?, ?, ?, ?, 0)`,
    [usuario_id, tipo, taller_id, competencia_id, filepath, codigo_verificacion]
  );

  return {
    id: result.insertId,
    usuario_id,
    usuario_nombre,
    tipo,
    archivo_url: filepath,
    codigo_verificacion
  };
}
