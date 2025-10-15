import db from "@/lib/db";
import { enviarDiplomaPorCorreo } from "@/lib/email";
import fs from 'fs';
import path from 'path';

/**
 * POST /api/diplomas/enviar
 * Envía un diploma por correo electrónico con el archivo adjunto
 */
export async function POST(req) {
  try {
    const { diploma_id, usuario_id } = await req.json();

    if (!diploma_id || !usuario_id) {
      return new Response(
        JSON.stringify({ error: 'diploma_id y usuario_id son requeridos' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obtener datos del diploma y usuario
    const [diplomaRows] = await db.query(
      `SELECT 
        d.id,
        d.archivo_url,
        d.codigo_verificacion,
        u.nombre,
        u.correo,
        CASE
          WHEN d.tipo = 'taller' THEN t.nombre
          WHEN d.tipo = 'competencia' THEN c.nombre
          ELSE 'Congreso de Tecnología'
        END as actividad_nombre,
        d.tipo
      FROM diplomas d
      JOIN usuarios u ON u.id = d.usuario_id
      LEFT JOIN talleres t ON d.taller_id = t.id
      LEFT JOIN competencias c ON d.competencia_id = c.id
      WHERE d.id = ? AND d.usuario_id = ?`,
      [diploma_id, usuario_id]
    );

    if (!diplomaRows || diplomaRows.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Diploma no encontrado' }), 
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const diploma = diplomaRows[0];
    
    // Leer el archivo del diploma desde el sistema de archivos
    const archivoPath = path.join(process.cwd(), 'public', diploma.archivo_url);
    
    if (!fs.existsSync(archivoPath)) {
      return new Response(
        JSON.stringify({ error: 'Archivo de diploma no encontrado en el servidor' }), 
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const diplomaBuffer = fs.readFileSync(archivoPath);

    // Enviar correo con el diploma adjunto
    const resultado = await enviarDiplomaPorCorreo({
      destinatario: diploma.correo,
      nombreParticipante: diploma.nombre,
      nombreActividad: diploma.actividad_nombre,
      diplomaBuffer: diplomaBuffer
    });

    if (!resultado.success) {
      throw new Error(resultado.error || 'Error al enviar correo');
    }

    // Marcar como enviado
    await db.query(
      'UPDATE diplomas SET enviado = 1, enviado_en = NOW() WHERE id = ?',
      [diploma_id]
    );

    console.log(`✅ Diploma enviado exitosamente a ${diploma.correo} con archivo adjunto`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Diploma enviado correctamente al correo con archivo adjunto',
        correo: diploma.correo 
      }), 
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error enviando diploma:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Error al enviar el diploma por correo',
        details: error.message 
      }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
