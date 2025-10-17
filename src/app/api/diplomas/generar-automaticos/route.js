import db from "@/lib/db";
import { generarDiplomaPDF } from "@/lib/diplomaGenerator";
import crypto from 'crypto';
import { put } from '@vercel/blob';

/**
 * POST /api/diplomas/generar-automaticos
 * Genera diplomas automáticamente para:
 * 1. Usuarios con asistencias registradas en talleres/competencias finalizados
 * 2. Ganadores de competencias (1°, 2°, 3° lugar)
 */
export async function POST(req) {
  try {
    const { tipo } = await req.json(); // 'asistencia' | 'ganadores' |
    
    const diplomasGenerados = [];
    const errores = [];

    if (tipo === 'asistencia' || tipo === 'all') {
      // DIPLOMAS POR ASISTENCIA A TALLERES
      try {
        const [talleres] = await db.query(`
          SELECT t.id, t.nombre, t.fecha
          FROM talleres t
          WHERE t.fecha < CURDATE() AND t.activo = 1
        `);

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

          for (const asistente of asistentes) {
            try {
              const resultado = await generarYGuardarDiploma({
                usuario_id: asistente.id,
                usuario_nombre: asistente.nombre,
                usuario_correo: asistente.correo,
                tipo: 'taller',
                taller_id: taller.id,
                titulo: `Por su participación en el taller: ${taller.nombre}`,
                subtitulo: taller.fecha ? `Realizado el ${new Date(taller.fecha).toLocaleDateString('es-GT')}` : null
              });
              diplomasGenerados.push(resultado);
            } catch (err) {
              errores.push({ usuario: asistente.nombre, error: err.message });
            }
          }
        }
      } catch (err) {
        console.error('Error generando diplomas de talleres:', err);
        errores.push({ tipo: 'talleres', error: err.message });
      }

      // DIPLOMAS POR ASISTENCIA A COMPETENCIAS
      try {
        const [competencias] = await db.query(`
          SELECT c.id, c.nombre, c.fecha
          FROM competencias c
          WHERE c.fecha < CURDATE() AND c.activo = 1
        `);

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
              )
          `, [competencia.id, competencia.id]);

          for (const asistente of asistentes) {
            try {
              const resultado = await generarYGuardarDiploma({
                usuario_id: asistente.id,
                usuario_nombre: asistente.nombre,
                usuario_correo: asistente.correo,
                tipo: 'competencia',
                competencia_id: competencia.id,
                titulo: `Por su participación en la competencia: ${competencia.nombre}`,
                subtitulo: competencia.fecha ? `Realizada el ${new Date(competencia.fecha).toLocaleDateString('es-GT')}` : null
              });
              diplomasGenerados.push(resultado);
            } catch (err) {
              errores.push({ usuario: asistente.nombre, error: err.message });
            }
          }
        }
      } catch (err) {
        console.error('Error generando diplomas de competencias:', err);
        errores.push({ tipo: 'competencias', error: err.message });
      }
    }

    if (tipo === 'ganadores' || tipo === 'all') {
      // DIPLOMAS PARA GANADORES DE COMPETENCIAS
      try {
        const anioActual = new Date().getFullYear();
        const [ganadores] = await db.query(`
          SELECT 
            r.id, r.usuario_id, r.puesto, r.competencia_id,
            u.nombre as usuario_nombre, u.correo as usuario_correo,
            c.nombre as competencia_nombre, c.fecha
          FROM resultados_competencias r
          JOIN usuarios u ON u.id = r.usuario_id
          JOIN competencias c ON c.id = r.competencia_id
          WHERE r.anio = ?
            AND r.puesto <= 3
            AND NOT EXISTS (
              SELECT 1 FROM diplomas d
              WHERE d.usuario_id = r.usuario_id
                AND d.tipo = 'competencia'
                AND d.competencia_id = r.competencia_id
                AND d.codigo_verificacion LIKE CONCAT('%', r.puesto, 'LUGAR%')
            )
        `, [anioActual]);

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
            errores.push({ usuario: ganador.usuario_nombre, error: err.message });
          }
        }
      } catch (err) {
        console.error('Error generando diplomas de ganadores:', err);
        errores.push({ tipo: 'ganadores', error: err.message });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        generados: diplomasGenerados.length,
        diplomas: diplomasGenerados,
        errores: errores.length > 0 ? errores : undefined
      }), 
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error en generación automática de diplomas:', error);
    return new Response(
      JSON.stringify({ error: 'Error al generar diplomas automáticamente.' }), 
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

  const filename = `${crypto.randomBytes(16).toString('hex')}.pdf`;
  let filepath;

  // Verificar si estamos en Vercel (producción) o local (desarrollo)
  const isProduction = process.env.VERCEL === '1' || process.env.BLOB_READ_WRITE_TOKEN;

  if (isProduction) {
    // En Vercel: usar Blob Storage
    try {
      const blob = await put(`diplomas/${filename}`, pdfBuffer, {
        access: 'public',
        contentType: 'application/pdf',
      });
      filepath = blob.url;
      console.log('Diploma guardado en Vercel Blob:', filepath);
    } catch (error) {
      console.error('Error guardando en Vercel Blob:', error);
      throw new Error('Error al guardar diploma en almacenamiento');
    }
  } else {
    // En desarrollo local: usar sistema de archivos
    filepath = `/diplomas/${filename}`;
    
    const fs = require('fs').promises;
    const path = require('path');
    const dir = path.join(process.cwd(), 'public', 'diplomas');
    
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
    
    await fs.writeFile(path.join(process.cwd(), 'public', filepath), pdfBuffer);
    console.log('Diploma guardado localmente:', filepath);
  }

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
