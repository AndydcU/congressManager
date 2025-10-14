import db from "@/lib/db";
import { enviarCorreoInscripcion } from "@/lib/email";
import { generateTokenWithPrefix } from "@/lib/tokenGenerator";

export async function POST(req) {
  try {
    const { usuario_id, competencia_id } = await req.json();

    if (!usuario_id || !competencia_id) {
      return new Response(JSON.stringify({ error: "Datos incompletos" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verificar que exista la competencia
    const [competencias] = await db.query(
      "SELECT id, nombre, fecha, hora_inicio, hora_fin, cupo FROM competencias WHERE id = ?",
      [competencia_id]
    );
    if (competencias.length === 0) {
      return new Response(JSON.stringify({ error: "Competencia no encontrada" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Obtener información del usuario
    const [usuario] = await db.query(
      "SELECT nombre, correo FROM usuarios WHERE id = ?",
      [usuario_id]
    );
    if (!usuario.length) {
      return new Response(JSON.stringify({ error: "Usuario no encontrado" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verificar duplicado
    const [exists] = await db.query(
      "SELECT 1 FROM inscripciones_competencias WHERE usuario_id = ? AND competencia_id = ?",
      [usuario_id, competencia_id]
    );
    if (exists.length > 0) {
      return new Response(JSON.stringify({ error: "Ya está inscrito en esta competencia" }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validar cupo si aplica
    const cupo = Number(competencias[0].cupo) || 0;
    if (cupo > 0) {
      const [countRows] = await db.query(
        "SELECT COUNT(*) AS inscritos FROM inscripciones_competencias WHERE competencia_id = ? AND estado = 'confirmada'",
        [competencia_id]
      );
      const inscritos = Number(countRows[0]?.inscritos || 0);
      if (inscritos >= cupo) {
        return new Response(JSON.stringify({ error: "Cupo completo para esta competencia" }), {
          status: 409,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Generar token único para esta inscripción
    const token = generateTokenWithPrefix("competencia", competencia_id);

    // Realizar la inscripción con token
    await db.query(
      "INSERT INTO inscripciones_competencias (usuario_id, competencia_id, token) VALUES (?, ?, ?)",
      [usuario_id, competencia_id, token]
    );

    // Enviar correo de confirmación (no bloquea el éxito de la inscripción)
    const horario = competencias[0].hora_inicio && competencias[0].hora_fin 
      ? `${competencias[0].hora_inicio} - ${competencias[0].hora_fin}` 
      : null;

    const emailResult = await enviarCorreoInscripcion({
      destinatario: usuario[0].correo,
      nombreParticipante: usuario[0].nombre,
      nombreActividad: competencias[0].nombre,
      tipoActividad: "competencia",
      fecha: competencias[0].fecha
        ? new Date(competencias[0].fecha).toLocaleDateString("es-GT", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : null,
      horario: horario,
    });

    if (!emailResult.success) {
      console.warn(
        "⚠️ Inscripción exitosa pero el correo no pudo ser enviado:",
        emailResult.error
      );
    }

    return new Response(
      JSON.stringify({
        message: "Inscripción a competencia realizada con éxito",
        emailSent: emailResult.success,
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error al inscribir en competencia:", error);
    return new Response(
      JSON.stringify({ error: "Error al inscribir usuario en competencia" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const competenciaId = searchParams.get("competencia_id");
    const usuarioId = searchParams.get("usuario_id");

    // A) Inscritos por competencia (para el panel admin)
    if (competenciaId) {
      const [rows] = await db.query(
        `
        SELECT 
          ic.id,
          ic.usuario_id,
          u.nombre,
          u.colegio,
          u.correo,
          u.telefono,
          u.tipo_usuario,
          ic.estado,
          ic.registrado_en
        FROM inscripciones_competencias ic
        INNER JOIN usuarios u ON u.id = ic.usuario_id
        WHERE ic.competencia_id = ?
        ORDER BY ic.registrado_en DESC
        `,
        [Number(competenciaId)]
      );

      return new Response(JSON.stringify(rows || []), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // B) Competencias por usuario
    if (usuarioId) {
      const [rows] = await db.query(
        `
        SELECT 
          ic.id,
          ic.competencia_id,
          c.nombre,
          c.hora_inicio,
          c.hora_fin,
          c.fecha,
          ic.estado,
          ic.registrado_en
        FROM inscripciones_competencias ic
        JOIN competencias c ON ic.competencia_id = c.id
        WHERE ic.usuario_id = ?
        ORDER BY ic.registrado_en DESC
        `,
        [Number(usuarioId)]
      );

      return new Response(JSON.stringify(rows || []), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Si no se envía ninguno, 400
    return new Response(
      JSON.stringify({ error: "Debe enviar competencia_id o usuario_id" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error en GET /api/inscripciones-competencias:", error);
    return new Response(
      JSON.stringify({ error: "Error al obtener inscripciones de competencias" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
