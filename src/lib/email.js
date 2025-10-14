import nodemailer from 'nodemailer';

// Configurar transporter con las credenciales del .env.local
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Envía un correo de confirmación de inscripción
 * @param {string} destinatario - Email del participante
 * @param {string} nombreParticipante - Nombre del participante
 * @param {string} nombreActividad - Nombre del taller o competencia
 * @param {string} tipoActividad - 'taller' o 'competencia'
 * @param {string} fecha - Fecha de la actividad
 * @param {string} horario - Horario de la actividad
 */
export async function enviarCorreoInscripcion({
  destinatario,
  nombreParticipante,
  nombreActividad,
  tipoActividad,
  fecha,
  horario,
}) {
  const asunto = `✅ Confirmación de inscripción - ${nombreActividad}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .info-box { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #3b82f6; border-radius: 5px; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        h1 { margin: 0; font-size: 28px; }
        h2 { color: #1e3a8a; margin-top: 0; }
        .highlight { color: #3b82f6; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 ¡Inscripción Confirmada!</h1>
        </div>
        <div class="content">
          <p>Hola <strong>${nombreParticipante}</strong>,</p>
          
          <p>Tu inscripción al ${tipoActividad === 'taller' ? 'taller' : 'la competencia'} <span class="highlight">"${nombreActividad}"</span> ha sido confirmada exitosamente.</p>
          
          <div class="info-box">
            <h2>📋 Detalles de la actividad</h2>
            <p><strong>Tipo:</strong> ${tipoActividad === 'taller' ? 'Taller' : 'Competencia'}</p>
            <p><strong>Nombre:</strong> ${nombreActividad}</p>
            ${fecha ? `<p><strong>📅 Fecha:</strong> ${fecha}</p>` : ''}
            ${horario ? `<p><strong>🕐 Horario:</strong> ${horario}</p>` : ''}
          </div>
          
          <div class="info-box">
            <h2>📌 Instrucciones importantes</h2>
            <ul>
              <li>Llega <strong>15 minutos antes</strong> del inicio de la actividad</li>
              <li>Presenta tu <strong>código QR</strong> en la entrada para registrar tu asistencia</li>
              <li>Puedes ver tu código QR desde tu perfil en la plataforma</li>
              <li>No olvides traer material de escritura y estar listo para aprender</li>
            </ul>
          </div>
          
          <center>
            <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/mi-perfil" class="button">
              Ver mi Perfil y Código QR
            </a>
          </center>
          
          <p>Si tienes alguna duda o necesitas más información, no dudes en contactarnos.</p>
          
          <p>¡Nos vemos pronto!</p>
          
          <p><strong>Equipo del Congreso de Tecnología</strong></p>
        </div>
        <div class="footer">
          <p>Este es un correo automático, por favor no responder.</p>
          <p>© ${new Date().getFullYear()} Congreso de Tecnología - Todos los derechos reservados</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"Congreso de Tecnología" <${process.env.EMAIL_USER}>`,
    to: destinatario,
    subject: asunto,
    html: html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Correo enviado a ${destinatario}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error al enviar correo:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Envía un comprobante de pago por correo electrónico
 * @param {string} destinatario - Email del participante
 * @param {string} nombreParticipante - Nombre del participante
 * @param {string} nombreActividad - Nombre del taller o competencia
 * @param {string} tipoActividad - 'taller' o 'competencia'
 * @param {number} monto - Monto pagado
 * @param {string} metodoPago - Método de pago utilizado
 */
export async function enviarComprobantePago({
  destinatario,
  nombreParticipante,
  nombreActividad,
  tipoActividad,
  monto,
  metodoPago,
}) {
  const asunto = `💳 Comprobante de Pago - ${nombreActividad}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .info-box { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #22c55e; border-radius: 5px; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        h1 { margin: 0; font-size: 28px; }
        .amount { font-size: 36px; font-weight: bold; color: #16a34a; text-align: center; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Pago Confirmado</h1>
        </div>
        <div class="content">
          <p>Hola <strong>${nombreParticipante}</strong>,</p>
          
          <p>Tu pago ha sido procesado exitosamente. A continuación encontrarás los detalles de tu transacción:</p>
          
          <div class="amount">Q${parseFloat(monto).toFixed(2)}</div>
          
          <div class="info-box">
            <h2 style="color: #16a34a; margin-top: 0;">📋 Detalles del Pago</h2>
            <p><strong>Concepto:</strong> Inscripción a ${tipoActividad === 'taller' ? 'Taller' : 'Competencia'}</p>
            <p><strong>Actividad:</strong> ${nombreActividad}</p>
            <p><strong>Monto Pagado:</strong> Q${parseFloat(monto).toFixed(2)}</p>
            <p><strong>Método de Pago:</strong> ${metodoPago.charAt(0).toUpperCase() + metodoPago.slice(1)}</p>
            <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-GT', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
          </div>
          
          <div class="info-box">
            <h2 style="color: #1e3a8a; margin-top: 0;">🎉 ¡Inscripción Confirmada!</h2>
            <p>Tu inscripción a "${nombreActividad}" ha sido completada exitosamente.</p>
            <p>Revisa tu correo para más detalles sobre la actividad.</p>
          </div>
          
          <p>Guarda este comprobante como referencia. Si tienes alguna duda, no dudes en contactarnos.</p>
          
          <p><strong>Equipo del Congreso de Tecnología</strong></p>
        </div>
        <div class="footer">
          <p>Este es un correo automático, por favor no responder.</p>
          <p>© ${new Date().getFullYear()} Congreso de Tecnología - Todos los derechos reservados</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"Congreso de Tecnología" <${process.env.EMAIL_USER}>`,
    to: destinatario,
    subject: asunto,
    html: html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Comprobante de pago enviado a ${destinatario}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error al enviar comprobante:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Envía un correo con el diploma adjunto
 * @param {string} destinatario - Email del participante
 * @param {string} nombreParticipante - Nombre del participante
 * @param {string} nombreActividad - Nombre del taller o competencia
 * @param {Buffer} diplomaBuffer - Buffer del diploma en formato PNG
 */
export async function enviarDiplomaPorCorreo({
  destinatario,
  nombreParticipante,
  nombreActividad,
  diplomaBuffer,
}) {
  const asunto = `🎓 Tu Diploma - ${nombreActividad}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        h1 { margin: 0; font-size: 28px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎓 ¡Felicitaciones!</h1>
        </div>
        <div class="content">
          <p>Hola <strong>${nombreParticipante}</strong>,</p>
          
          <p>Adjunto encontrarás tu <strong>Certificado de Participación</strong> por haber completado exitosamente: <strong>"${nombreActividad}"</strong>.</p>
          
          <p>Este diploma reconoce tu dedicación y esfuerzo durante la actividad. Esperamos que hayas disfrutado la experiencia y que los conocimientos adquiridos te sean de gran utilidad.</p>
          
          <p>También puedes descargar tu diploma en cualquier momento desde tu perfil en la plataforma del congreso.</p>
          
          <p>¡Gracias por tu participación y esperamos verte en futuros eventos!</p>
          
          <p><strong>Equipo del Congreso de Tecnología</strong></p>
        </div>
        <div class="footer">
          <p>Este es un correo automático, por favor no responder.</p>
          <p>© ${new Date().getFullYear()} Congreso de Tecnología - Todos los derechos reservados</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"Congreso de Tecnología" <${process.env.EMAIL_USER}>`,
    to: destinatario,
    subject: asunto,
    html: html,
    attachments: [
      {
        filename: `Diploma-${nombreActividad.replace(/\s+/g, '-')}.png`,
        content: diplomaBuffer,
        contentType: 'image/png',
      },
    ],
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Diploma enviado a ${destinatario}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error al enviar diploma:', error);
    return { success: false, error: error.message };
  }
}
