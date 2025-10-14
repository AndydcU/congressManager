import db from "@/lib/db";
import { enviarCorreoInscripcion } from "@/lib/email";
import { generateTokenWithPrefix } from "@/lib/tokenGenerator";

export async function POST(req) {
  try {
    const { participante_id, taller_id } = await req.json();
    if (!participante_id || !taller_id)
      return Response.json({ error: "Datos incompletos" }, { status: 400 });

    // Verificar si ya está inscrito
    const [exists] = await db.query(
      "SELECT * FROM inscripciones WHERE participante_id = ? AND taller_id = ?",
      [participante_id, taller_id]
    );
    if (exists.length > 0)
      return Response.json({ error: "Ya está inscrito en esta actividad" }, { status: 400 });

    // Obtener información del participante
    const [participante] = await db.query(
      "SELECT nombre, correo FROM participantes WHERE id = ?",
      [participante_id]
    );

    // Obtener información del taller
    const [taller] = await db.query(
      "SELECT nombre, fecha, horario FROM talleres WHERE id = ?",
      [taller_id]
    );

    if (!participante.length || !taller.length) {
      return Response.json({ error: "Participante o taller no encontrado" }, { status: 404 });
    }

    // Generar token único para esta inscripción
    const token = generateTokenWithPrefix('taller', taller_id);

    // Realizar la inscripción con token
    await db.query(
      "INSERT INTO inscripciones (participante_id, taller_id, token) VALUES (?, ?, ?)",
      [participante_id, taller_id, token]
    );

    // Enviar correo de confirmación
    const emailResult = await enviarCorreoInscripcion({
      destinatario: participante[0].correo,
      nombreParticipante: participante[0].nombre,
      nombreActividad: taller[0].nombre,
      tipoActividad: 'taller',
      fecha: taller[0].fecha ? new Date(taller[0].fecha).toLocaleDateString('es-GT', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }) : null,
      horario: taller[0].horario,
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
    return Response.json({ error: "Error al inscribir participante" }, { status: 500 });
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const participanteId = searchParams.get("participante_id");

  try {
    if (!participanteId)
      return Response.json({ error: "ID de participante requerido" }, { status: 400 });

    const [rows] = await db.query(
      `SELECT 
         i.id, 
         i.taller_id,
         t.nombre,
         t.horario
       FROM inscripciones i
       JOIN talleres t ON i.taller_id = t.id
       WHERE i.participante_id = ?`,
      [participanteId]
    );

    return Response.json(rows);
  } catch (error) {
    console.error("Error al obtener inscripciones:", error);
    return Response.json({ error: "Error al obtener inscripciones" }, { status: 500 });
  }
}
