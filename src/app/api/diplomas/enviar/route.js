import db from "@/lib/db";
import { enviarDiplomaPorCorreo } from "@/lib/email";
import { createCanvas } from 'canvas';

// POST /api/diplomas/enviar
// Genera y envía el diploma por correo electrónico
export async function POST(req) {
  try {
    const { diploma_id, participante_id } = await req.json();

    if (!diploma_id || !participante_id) {
      return Response.json({ error: "Datos incompletos" }, { status: 400 });
    }

    // Obtener información del diploma
    const [diplomas] = await db.query(
      `SELECT d.*, p.nombre, p.correo 
       FROM diplomas d
       JOIN participantes p ON d.participante_id = p.id
       WHERE d.id = ? AND d.participante_id = ?`,
      [diploma_id, participante_id]
    );

    if (!diplomas.length) {
      return Response.json({ error: "Diploma no encontrado" }, { status: 404 });
    }

    const diploma = diplomas[0];

    // Generar el diploma como imagen usando canvas
    const canvas = createCanvas(1200, 850);
    const ctx = canvas.getContext('2d');

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#1e3a8a');
    gradient.addColorStop(1, '#3b82f6');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Border
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 20;
    ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

    // Inner border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 5;
    ctx.strokeRect(60, 60, canvas.width - 120, canvas.height - 120);

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 60px serif';
    ctx.textAlign = 'center';
    ctx.fillText('CERTIFICADO DE PARTICIPACIÓN', canvas.width / 2, 180);

    // Subtitle
    ctx.font = 'italic 30px serif';
    ctx.fillText('Se otorga a:', canvas.width / 2, 280);

    // Participant name
    ctx.font = 'bold 50px serif';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(diploma.nombre.toUpperCase(), canvas.width / 2, 360);

    // Text
    ctx.fillStyle = '#ffffff';
    ctx.font = '28px serif';
    ctx.fillText('Por su participación en', canvas.width / 2, 440);

    // Activity name
    ctx.font = 'bold 38px serif';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(diploma.actividad_nombre, canvas.width / 2, 500);

    // Type
    ctx.fillStyle = '#ffffff';
    ctx.font = 'italic 24px serif';
    ctx.fillText(`(${diploma.tipo})`, canvas.width / 2, 545);

    // Date
    ctx.font = '22px serif';
    const fecha = new Date(diploma.fecha_emision).toLocaleDateString('es-GT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    ctx.fillText(`Emitido el ${fecha}`, canvas.width / 2, 650);

    // Footer
    ctx.font = 'italic 20px serif';
    ctx.fillText('Congreso de Tecnología', canvas.width / 2, 750);

    // Convertir canvas a buffer
    const buffer = canvas.toBuffer('image/png');

    // Enviar correo con el diploma
    const emailResult = await enviarDiplomaPorCorreo({
      destinatario: diploma.correo,
      nombreParticipante: diploma.nombre,
      nombreActividad: diploma.actividad_nombre,
      diplomaBuffer: buffer,
    });

    if (!emailResult.success) {
      return Response.json(
        { error: "Error al enviar el diploma por correo", details: emailResult.error },
        { status: 500 }
      );
    }

    return Response.json({
      message: "Diploma enviado exitosamente por correo electrónico",
      email: diploma.correo,
    });
  } catch (error) {
    console.error("Error al enviar diploma:", error);
    return Response.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}
