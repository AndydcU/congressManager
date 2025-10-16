import db from '@/lib/db';
import { del } from '@vercel/blob';

// DELETE /api/diplomas?id=... → eliminar diploma (solo admin)
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get('id'));
    
    if (!id) {
      return new Response(
        JSON.stringify({ error: 'id es obligatorio' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obtener info del diploma antes de eliminar
    const [diploma] = await db.query(
      'SELECT archivo_url FROM diplomas WHERE id = ?',
      [id]
    );

    if (!diploma || diploma.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Diploma no encontrado' }), 
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Eliminar de BD
    await db.query('DELETE FROM diplomas WHERE id = ?', [id]);

    // Intentar eliminar archivo
    const archivoUrl = diploma[0].archivo_url;
    const isProduction = process.env.VERCEL === '1' || process.env.BLOB_READ_WRITE_TOKEN;
    
    try {
      if (isProduction && archivoUrl.includes('blob.vercel-storage.com')) {
        // Eliminar de Vercel Blob
        await del(archivoUrl);
        console.log('Archivo eliminado de Vercel Blob:', archivoUrl);
      } else if (!isProduction) {
        // Eliminar archivo local
        const fs = require('fs').promises;
        const path = require('path');
        const filepath = path.join(process.cwd(), 'public', archivoUrl);
        await fs.unlink(filepath);
        console.log('Archivo eliminado localmente:', filepath);
      }
    } catch (fileErr) {
      console.warn('No se pudo eliminar el archivo:', fileErr);
    }

    return new Response(
      JSON.stringify({ success: true }), 
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error en DELETE /api/diplomas:', error);
    return new Response(
      JSON.stringify({ error: 'Error al eliminar diploma.' }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// GET /api/diplomas?usuario_id=... → lista diplomas del usuario con detalles
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const usuario_id = Number(searchParams.get('usuario_id'));
    
    console.log('📥 GET /api/diplomas - usuario_id:', usuario_id);
    
    if (!usuario_id) {
      return new Response(
        JSON.stringify({ error: 'usuario_id requerido' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔍 Consultando diplomas para usuario:', usuario_id);

    const [rows] = await db.query(
      `SELECT 
        d.id,
        d.tipo,
        d.taller_id,
        d.competencia_id,
        d.archivo_url,
        d.codigo_verificacion,
        d.enviado,
        d.enviado_en,
        d.emitido_en,
        CASE
          WHEN d.tipo = 'taller' THEN t.nombre
          WHEN d.tipo = 'competencia' THEN c.nombre
          ELSE 'Asistencia General'
        END as actividad_nombre,
        CASE
          WHEN d.tipo = 'taller' THEN t.fecha
          WHEN d.tipo = 'competencia' THEN c.fecha
          ELSE NULL
        END as fecha_actividad
      FROM diplomas d
      LEFT JOIN talleres t ON d.taller_id = t.id
      LEFT JOIN competencias c ON d.competencia_id = c.id
      WHERE d.usuario_id = ? 
      ORDER BY d.emitido_en DESC`,
      [usuario_id]
    );

    console.log('✅ Diplomas encontrados:', rows.length);

    return new Response(
      JSON.stringify(rows || []), 
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ ERROR COMPLETO en GET /api/diplomas:', error);
    console.error('Stack:', error.stack);
    console.error('SQL Message:', error.sqlMessage);
    return new Response(
      JSON.stringify({ 
        error: 'Error al listar diplomas.',
        details: error.message,
        sqlError: error.sqlMessage || 'No SQL error'
      }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
