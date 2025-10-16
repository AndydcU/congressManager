import db from "@/lib/db";
import { generarDiplomaPDF } from "@/lib/diplomaGenerator";
import crypto from 'crypto';
import { put } from '@vercel/blob';

/**
 * POST /api/diplomas/generar-ganadores
 * Genera diplomas para TODOS los ganadores marcados, sin importar si la competencia finalizó
 */
export async function POST(req) {
  try {
    const diplomasGenerados = [];
    const errores = [];
    const anioActual = new Date().getFullYear();

    console.log('🏆 Generando diplomas de ganadores...');

    // Obtener TODOS los ganadores del año actual
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
            AND (
              d.codigo_verificacion LIKE '%PRIMERLUGAR%' OR
              d.codigo_verificacion LIKE '%SEGUNDOLUGAR%' OR
              d.codigo_verificacion LIKE '%TERCERLUGAR%'
            )
        )
      ORDER BY r.competencia_id, r.puesto
    `, [anioActual]);

    console.log(`📋 Ganadores sin diploma: ${ganadores.length}`);

    for (const ganador of ganadores) {
      try {
        const puestoTexto = ganador.puesto === 1 ? 'PRIMER' : ganador.puesto === 2 ? 'SEGUNDO' : 'TERCER';
        
        console.log(`Generando diploma para ${ganador.usuario_nombre} - ${puestoTexto} lugar`);
        
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
        console.log(`✅ Diploma generado: ${resultado.codigo_verificacion}`);
      } catch (err) {
        console.error(`❌ Error generando diploma para ${ganador.usuario_nombre}:`, err.message);
        errores.push({ usuario: ganador.usuario_nombre, error: err.message });
      }
    }

    console.log(`✅ Proceso completado. Diplomas generados: ${diplomasGenerados.length}`);

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
    console.error('❌ Error en generación de diplomas de ganadores:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Error al generar diplomas de ganadores',
        details: error.message,
        stack: error.stack
      }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * GET - Muestra cuántos ganadores necesitan diplomas
 */
export async function GET(req) {
  try {
    const anioActual = new Date().getFullYear();
    
    const [ganadores] = await db.query(`
      SELECT COUNT(*) as total
      FROM resultados_competencias r
      WHERE r.anio = ?
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
    `, [anioActual]);

    return new Response(
      JSON.stringify({ 
        ganadoresSinDiploma: ganadores[0].total,
        mensaje: `Hay ${ganadores[0].total} ganadores sin diploma. Usa POST para generar sus diplomas.`
      }), 
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }), 
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
      console.log('📄 Diploma guardado en Vercel Blob:', filepath);
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
    console.log('📄 Diploma guardado localmente:', filepath);
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
