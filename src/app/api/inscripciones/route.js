import db from "@/lib/db";
import { enviarCorreoInscripcion } from "@/lib/email";
import { generateTokenWithPrefix } from "@/lib/tokenGenerator";

export async function POST(req) {
  try {
    const { usuario_id, taller_id } = await req.json();
    if (!usuario_id || !taller_id)
      return Response.json({ error: "Datos incompletos" }, { status: 400 });

    // Verificar si ya está inscrito
    const [exists] = await db.query(
      "SELECT * FROM inscripciones WHERE usuario_id = ? AND taller_id = ?",
      [usuario_id, taller_id]
    );
    if (exists.length > 0)
      return Response.json({ error: "Ya está inscrito en esta actividad" }, { status: 400 });

    // Obtener información del usuario
    const [usuario] = await db.query(
      "SELECT nombre, correo FROM usuarios WHERE id = ?",
      [usuario_id]
    );

    // Obtener información del taller
    const [taller] = await db.query(
      "SELECT nombre, fecha, hora_inicio, hora_fin FROM talleres WHERE id = ?",
      [taller_id]
    );

    if (!usuario.length || !taller.length) {
      return Response.json({ error: "Usuario o taller no encontrado" }, { status: 404 });
    }

    // Generar token único para esta inscripción
    const token = generateTokenWithPrefix('taller', taller_id);

    // Realizar la inscripción con token
    await db.query(
      "INSERT INTO inscripciones (usuario_id, taller_id, token) VALUES (?, ?, ?)",
      [usuario_id, taller_id, token]
    );

    // Enviar correo de confirmación
    const horario = taller[0].hora_inicio && taller[0].hora_fin 
      ? `${taller[0].hora_inicio} - ${taller[0].hora_fin}` 
      : null;

    const emailResult = await enviarCorreoInscripcion({
      destinatario: usuario[0].correo,
      nombreParticipante: usuario[0].nombre,
      nombreActividad: taller[0].nombre,
      tipoActividad: 'taller',
      fecha: taller[0].fecha ? new Date(taller[0].fecha).toLocaleDateString('es-GT', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }) : null,
      horario: horario,
    });

    if (!emailResult.success) {
      console.warn('⚠️ Inscripción exitosa pero el correo no pudo ser enviado:', emailResult.error);
    }

    return Response.json({ 
      message: "Inscripción realizada con éxito",
      emailSent: emailResult.success 
    });
  } catch (error) {
    console.error("Error al inscribir:", error);
    return Response.json({ error: "Error al inscribir usuario" }, { status: 500 });
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const usuarioId = searchParams.get("usuario_id");

  try {
    if (!usuarioId)
      return Response.json({ error: "ID de usuario requerido" }, { status: 400 });

    const [rows] = await db.query(
      `SELECT 
         i.id, 
         i.taller_id,
         t.nombre,
         t.hora_inicio,
         t.hora_fin,
         t.fecha,
         i.estado,
         i.fecha_inscripcion
       FROM inscripciones i
       JOIN talleres t ON i.taller_id = t.id
       WHERE i.usuario_id = ?
       ORDER BY i.fecha_inscripcion DESC`,
      [usuarioId]
    );

    return Response.json(Array.isArray(rows) ? rows : []);
  } catch (error) {
    console.error("Error al obtener inscripciones:", error);
    return Response.json({ error: "Error al obtener inscripciones" }, { status: 500 });
  }
}
