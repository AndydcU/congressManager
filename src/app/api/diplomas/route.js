import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { writeFile, mkdir, stat } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import db from '@/lib/db';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

async function ensureDir(dir) {
  try { await stat(dir); } catch { await mkdir(dir, { recursive: true }); }
}

async function generateDiplomaPDF({ nombreParticipante, titulo, subtitulo }) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([842, 595]); // A4 landscape
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Fondo simple
  page.drawRectangle({ x: 0, y: 0, width: 842, height: 595, color: rgb(1, 1, 1) });
  page.drawRectangle({ x: 8, y: 8, width: 826, height: 579, color: rgb(1, 1, 1) });
  page.drawRectangle({ x: 12, y: 12, width: 818, height: 571, color: rgb(0.97, 0.97, 0.97) });

  const title = 'Diploma de Reconocimiento';
  page.drawText(title, { x: 240, y: 500, size: 28, font, color: rgb(0.15, 0.2, 0.6) });

  page.drawText('Otorgado a', { x: 380, y: 440, size: 14, font, color: rgb(0.3, 0.3, 0.3) });
  page.drawText(nombreParticipante, { x: 210, y: 400, size: 24, font, color: rgb(0, 0, 0) });

  page.drawText(titulo, { x: 160, y: 340, size: 16, font, color: rgb(0.2, 0.2, 0.2) });
  if (subtitulo) {
    page.drawText(subtitulo, { x: 160, y: 310, size: 12, font, color: rgb(0.35, 0.35, 0.35) });
  }

  // Firma simple
  page.drawLine({ start: { x: 160, y: 160 }, end: { x: 360, y: 160 }, thickness: 1, color: rgb(0.5, 0.5, 0.5) });
  page.drawText('Comité Organizador', { x: 200, y: 140, size: 10, font, color: rgb(0.3, 0.3, 0.3) });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

// POST /api/diplomas → genera y almacena diploma
export async function POST(req) {
  try {
    const body = await req.json();
    const { usuario_id, tipo, taller_id, competencia_id } = body;

    if (!usuario_id || !tipo) {
      return new Response(JSON.stringify({ error: 'usuario_id y tipo son obligatorios.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Obtener datos del usuario
    const [uRows] = await db.query('SELECT id, nombre, correo FROM usuarios WHERE id = ? LIMIT 1', [usuario_id]);
    if (!Array.isArray(uRows) || uRows.length === 0) {
      return new Response(JSON.stringify({ error: 'Usuario no encontrado.' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }
    const usuario = uRows[0];

    // Preparar texto del diploma
    let titulo = '';
    let subtitulo = '';
    if (tipo === 'asistencia') {
      titulo = 'Por su asistencia al Congreso de Tecnología';
    } else if (tipo === 'taller' && taller_id) {
      const [tRows] = await db.query('SELECT nombre FROM talleres WHERE id = ? LIMIT 1', [taller_id]);
      const nombreTaller = tRows[0]?.nombre || 'Taller';
      titulo = `Por su participación en el taller: ${nombreTaller}`;
    } else if (tipo === 'competencia' && competencia_id) {
      const [cRows] = await db.query('SELECT nombre FROM competencias WHERE id = ? LIMIT 1', [competencia_id]);
      const nombreComp = cRows[0]?.nombre || 'Competencia';
      titulo = `Por su participación en la competencia: ${nombreComp}`;
    } else {
      return new Response(JSON.stringify({ error: 'Parámetros inválidos para el tipo de diploma.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Generar PDF
    const pdfBuffer = await generateDiplomaPDF({ nombreParticipante: usuario.nombre, titulo, subtitulo });

    // Guardar archivo en /public/diplomas
    const dir = path.join(process.cwd(), 'public', 'diplomas');
    await ensureDir(dir);
    const filename = `${crypto.randomBytes(16).toString('hex')}.pdf`;
    const filepath = path.join(dir, filename);
    await writeFile(filepath, pdfBuffer);
    const archivo_url = `/diplomas/${filename}`;

    // Guardar registro en BD
    const [result] = await db.query(
      `INSERT INTO diplomas (usuario_id, tipo, taller_id, competencia_id, archivo_url)
       VALUES (?, ?, ?, ?, ?)`,
      [usuario_id, tipo, taller_id || null, competencia_id || null, archivo_url]
    );

    // Enviar correo con link
    try {
      await transporter.sendMail({
        from: `"Congreso de Tecnología" <${process.env.EMAIL_USER}>`,
        to: usuario.correo,
        subject: 'Tu diploma está listo',
        html: `<p>Hola ${usuario.nombre},</p>
               <p>Tu diploma está listo para descarga:</p>
               <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}${archivo_url}" target="_blank">Descargar diploma</a></p>
               <p>Saludos,</p>`
      });
    } catch (mailErr) {
      console.error('Error enviando correo de diploma:', mailErr);
    }

    return new Response(JSON.stringify({ id: result.insertId, archivo_url }), { status: 201, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error en POST /api/diplomas:', error);
    return new Response(JSON.stringify({ error: 'Error al generar diploma.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

// GET /api/diplomas?usuario_id=... → lista diplomas del usuario
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const usuario_id = Number(searchParams.get('usuario_id'));
    if (!usuario_id) {
      return new Response(JSON.stringify({ error: 'usuario_id requerido' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const [rows] = await db.query(
      `SELECT id, tipo, taller_id, competencia_id, archivo_url, emitido_en
       FROM diplomas WHERE usuario_id = ? ORDER BY emitido_en DESC`,
      [usuario_id]
    );

    return new Response(JSON.stringify(rows || []), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error en GET /api/diplomas:', error);
    return new Response(JSON.stringify({ error: 'Error al listar diplomas.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
