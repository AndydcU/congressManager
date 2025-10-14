import db from "@/lib/db";
import { enviarCorreoInscripcion } from "@/lib/email";
import { generateTokenWithPrefix } from "@/lib/tokenGenerator";

/* =========================================================
   RUTA: /api/inscripciones-competencias

   Requiere en BD:
   CREATE TABLE inscripciones_competencias (
     id INT AUTO_INCREMENT PRIMARY KEY,
     participante_id INT NOT NULL,
     competencia_id INT NOT NULL,
     registrado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
      return Response.json({ error: "Datos incompletos" }, { status: 400 });
    }

    // Verificar que exista la competencia
    const [competencias] = await db.query(
      "SELECT id, nombre, fecha, horario, cupo FROM competencias WHERE id = ?",
      [competencia_id]
    );
    if (competencias.length === 0) {
      return Response.json({ error: "Competencia no encontrada" }, { status: 404 });
    }

    // Obtener información del participante
    const [participante] = await db.query(
      "SELECT nombre, correo FROM participantes WHERE id = ?",
      [participante_id]
    );
    if (!participante.length) {
      return Response.json({ error: "Participante no encontrado" }, { status: 404 });
    }

    // Verificar duplicado
    const [exists] = await db.query(
      "SELECT 1 FROM inscripciones_competencias WHERE participante_id = ? AND competencia_id = ?",
      [participante_id, competencia_id]
    );
    if (exists.length > 0) {
      return Response.json({ error: "Ya está inscrito en esta competencia" }, { status: 409 });
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
        return Response.json({ error: "Cupo completo para esta competencia" }, { status: 409 });
      }
    }

    // Generar token único para esta inscripción
    const token = generateTokenWithPrefix('competencia', competencia_id);

    // Realizar la inscripción con token
    await db.query(
      "INSERT INTO inscripciones_competencias (participante_id, competencia_id, token) VALUES (?, ?, ?)",
      [participante_id, competencia_id, token]
    );

    // Enviar correo de confirmación
    const emailResult = await enviarCorreoInscripcion({
      destinatario: participante[0].correo,
      nombreParticipante: participante[0].nombre,
      nombreActividad: competencias[0].nombre,
      tipoActividad: 'competencia',
      fecha: competencias[0].fecha ? new Date(competencias[0].fecha).toLocaleDateString('es-GT', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }) : null,
      horario: competencias[0].horario,
    });

    if (!emailResult.success) {
      console.warn('⚠️ Inscripción exitosa pero el correo no pudo ser enviado:', emailResult.error);
    }

    return Response.json({ 
      message: "Inscripción a competencia realizada con éxito",
      emailSent: emailResult.success 
    }, { status: 201 });
  } catch (error) {
    console.error("Error al inscribir en competencia:", error);
    return Response.json({ error: "Error al inscribir participante en competencia" }, { status: 500 });
  }
}

// GET → Lista inscripciones de competencias por participante
// Uso: /api/inscripciones-competencias?participante_id=123
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const participanteId = searchParams.get("participante_id");

    if (!participanteId) {
      return Response.json({ error: "ID de participante requerido" }, { status: 400 });
    }

    const [rows] = await db.query(
      `SELECT 
         ic.id,
         ic.competencia_id,
         c.nombre,
         c.horario
       FROM inscripciones_competencias ic
       JOIN competencias c ON ic.competencia_id = c.id
       WHERE ic.participante_id = ?
       ORDER BY ic.registrado_en DESC`,
      [participanteId]
    );

    return Response.json(rows);
  } catch (error) {
    console.error("Error al obtener inscripciones de competencias:", error);
    return Response.json({ error: "Error al obtener inscripciones de competencias" }, { status: 500 });
  }
}
