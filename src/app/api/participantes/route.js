// src/app/api/participantes/route.js
import pool from '@/lib/db';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

/* =========================================================
   CONFIGURACIÓN DEL TRANSPORTADOR DE CORREO
   ========================================================= */
const transporter = nodemailer.createTransport({
  service: 'gmail', // puedes cambiar por SMTP si usas otro proveedor
  auth: {
    user: process.env.EMAIL_USER, // remitente
    pass: process.env.EMAIL_PASS, // contraseña de aplicación (sin espacios)
  },
});

/* =========================================================
   GET /api/participantes → Lista o busca participantes
   Ejemplo: /api/participantes?busqueda=andres
   ========================================================= */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const busqueda = searchParams.get('busqueda');

    let query = `
      SELECT id, nombre, correo, colegio, telefono, tipo, creado_en
      FROM participantes
    `;
    const values = [];

    if (busqueda) {
      query += `
        WHERE 
          nombre LIKE ? OR 
          correo LIKE ? OR 
          colegio LIKE ? OR 
          telefono LIKE ? OR 
          tipo LIKE ?
        ORDER BY creado_en DESC
      `;
      const filtro = `%${busqueda}%`;
      values.push(filtro, filtro, filtro, filtro, filtro);
    } else {
      query += `ORDER BY creado_en DESC`;
    }

    const [rows] = await pool.query(query, values);

    return new Response(JSON.stringify(rows), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error al obtener participantes:', error);
    return new Response(
      JSON.stringify({ error: 'Error al obtener los participantes.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/* =========================================================
   POST /api/participantes → Crea un nuevo participante
   ========================================================= */
export async function POST(request) {
  const { nombre, correo, colegio, telefono, tipo } = await request.json();

  // ⚠️ Validación básica
  if (!correo || (tipo === 'externo' && (!nombre || !colegio || !telefono))) {
    return new Response(
      JSON.stringify({ error: 'Faltan datos obligatorios.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 🧩 Validar dominio institucional si es interno
  // Ahora validamos contra @miumg.edu.gt (dominio institucional indicado)
  if (tipo === 'interno' && !correo.toLowerCase().endsWith('@miumg.edu.gt')) {
    return new Response(
      JSON.stringify({
        error: 'Solo se permiten correos institucionales (@miumg.edu.gt).',
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // 🔐 Generar token seguro para QR
    const qr_token = crypto.randomBytes(24).toString('hex');

    // 📝 Guardar participante con token
    const [result] = await pool.execute(
      `
      INSERT INTO participantes
        (nombre, correo, colegio, telefono, tipo, qr_token)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [nombre || null, correo, colegio || null, telefono || null, tipo, qr_token]
    );

    const nuevo = {
      id: result.insertId,
      nombre,
      correo,
      colegio,
      telefono,
      tipo,
      qr_token,
    };

    /* =========================================================
       ✉️ Envío del correo de confirmación
       ========================================================= */
    try {
      await transporter.sendMail({
        from: `"Congreso de Tecnología" <${process.env.EMAIL_USER}>`,
        to: correo,
        subject: 'Confirmación de inscripción - Congreso de Tecnología',
        html: `
          <div style="font-family: Arial, sans-serif; color: #333;">
            <h2>¡Hola ${nombre || 'participante'}!</h2>
            <p>Tu inscripción al <b>Congreso de Tecnología</b> ha sido registrada exitosamente.</p>
            <p>Puedes consultar tus datos o tu código QR en la página de participantes:</p>
            <a href="${process.env.NEXT_PUBLIC_BASE_URL}/participantes"
               style="display:inline-block; padding:10px 20px; background-color:#1e40af; color:white; border-radius:5px; text-decoration:none;">
               Ver mis datos
            </a>
            <p style="margin-top:16px;">Código para escaneo (guárdalo o muéstralo el día del evento):</p>
            <pre style="background:#f3f4f6;padding:8px;border-radius:6px;white-space:pre-wrap;">{"token":"${qr_token}"}</pre>
            <p style="margin-top:20px;">¡Te esperamos en el evento!</p>
          </div>
        `,
      });
    } catch (error) {
      // No cancelamos la inserción si falla el envío; solo logueamos el error.
      console.error('Error al enviar correo de confirmación:', error);
    }

    return new Response(JSON.stringify(nuevo), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error al crear participante:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno al registrar el participante.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
