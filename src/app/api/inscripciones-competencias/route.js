import db from "@/lib/db";
import { enviarCorreoInscripcion } from "@/lib/email";
import { generateTokenWithPrefix } from "@/lib/tokenGenerator";

/* =========================================================
   RUTA: /api/inscripciones_competencias

   Requiere en BD:
   CREATE TABLE inscripciones_competencias (
     id INT AUTO_INCREMENT PRIMARY KEY,
     participante_id INT NOT NULL,
     competencia_id INT NOT NULL,
     registrado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     token VARCHAR(255) NULL,
     UNIQUE KEY uq_insc_comp (participante_id, competencia_id),
     FOREIGN KEY (participante_id) REFERENCES participantes(id) ON DELETE CASCADE,
     FOREIGN KEY (competencia_id) REFERENCES competencias(id) ON DELETE CASCADE
   );
========================================================= */

// POST → Inscribir participante en una competencia
export async function POST(req) {
  try {
    const { participante_id, competencia_id } = await req.json();

    if (!participante_id || !competencia_id) {
      return new Response(JSON.stringify({ error: "Datos incompletos" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verificar que exista la competencia
    const [competencias] = await db.query(
      "SELECT id, nombre, fecha, horario, cupo FROM competencias WHERE id = ?",
      [competencia_id]
    );
    if (competencias.length === 0) {
      return new Response(JSON.stringify({ error: "Competencia no encontrada" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Obtener información del participante
    const [participante] = await db.query(
      "SELECT nombre, correo FROM participantes WHERE id = ?",
      [participante_id]
    );
    if (!participante.length) {
      return new Response(JSON.stringify({ error: "Participante no encontrado" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verificar duplicado
    const [exists] = await db.query(
      "SELECT 1 FROM inscripciones_competencias WHERE participante_id = ? AND competencia_id = ?",
      [participante_id, competencia_id]
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
        "SELECT COUNT(*) AS inscritos FROM inscripciones_competencias WHERE competencia_id = ?",
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
      "INSERT INTO inscripciones_competencias (participante_id, competencia_id, token) VALUES (?, ?, ?)",
      [participante_id, competencia_id, token]
    );

    // Enviar correo de confirmación (no bloquea el éxito de la inscripción)
    const emailResult = await enviarCorreoInscripcion({
      destinatario: participante[0].correo,
      nombreParticipante: participante[0].nombre,
      nombreActividad: competencias[0].nombre,
      tipoActividad: "competencia",
      fecha: competencias[0].fecha
        ? new Date(competencias[0].fecha).toLocaleDateString("es-GT", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : null,
      horario: competencias[0].horario,
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
      JSON.stringify({ error: "Error al inscribir participante en competencia" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

/**
 * GET
 * - /api/inscripciones_competencias?competencia_id=123  → inscritos de una competencia (para el panel admin)
 * - /api/inscripciones_competencias?participante_id=123 → competencias a las que se inscribió un participante (tu caso original)
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const competenciaId = searchParams.get("competencia_id");
    const participanteId = searchParams.get("participante_id");

    // A) Inscritos por competencia (lo que usa el módulo de Resultados Admin)
    if (competenciaId) {
      const [rows] = await db.query(
        `
        SELECT 
          ic.id,
          ic.participante_id,
          p.nombre,
          p.colegio,
          p.correo,
          p.telefono,
          ic.registrado_en
        FROM inscripciones_competencias ic
        INNER JOIN participantes p ON p.id = ic.participante_id
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

    // B) Competencias por participante (tu GET original)
    if (participanteId) {
      const [rows] = await db.query(
        `
        SELECT 
          ic.id,
          ic.competencia_id,
          c.nombre,
          c.horario,
          ic.registrado_en
        FROM inscripciones_competencias ic
        JOIN competencias c ON ic.competencia_id = c.id
        WHERE ic.participante_id = ?
        ORDER BY ic.registrado_en DESC
        `,
        [Number(participanteId)]
      );

      return new Response(JSON.stringify(rows || []), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Si no se envía ninguno, 400
    return new Response(
      JSON.stringify({ error: "Debe enviar competencia_id o participante_id" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error en GET /api/inscripciones_competencias:", error);
    return new Response(
      JSON.stringify({ error: "Error al obtener inscripciones de competencias" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
