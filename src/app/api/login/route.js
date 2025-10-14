import db from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const { correo, password } = await req.json();

    if (!correo || !password) {
      return Response.json({ error: "Correo y contraseña requeridos" }, { status: 400 });
    }

    const [rows] = await db.query(
      "SELECT id, nombre, correo, rol, contrasena FROM usuarios WHERE correo = ?",
      [correo]
    );

    if (rows.length === 0) {
      return Response.json({ error: "Credenciales incorrectas" }, { status: 401 });
    }

    const user = rows[0];

    // Validar contraseña con bcrypt
    const isValid = await bcrypt.compare(password, user.contrasena);
    if (!isValid) {
      return Response.json({ error: "Credenciales incorrectas" }, { status: 401 });
    }

    // Buscar participante_id y sus inscripciones
    let participanteInfo = null;
    let inscripciones = { talleres: [], competencias: [] };
    
    try {
      const [participantes] = await db.query(
        "SELECT id, nombre, correo, tipo_usuario, carnet, grado, colegio FROM participantes WHERE correo = ?",
        [correo]
      );
      
      if (participantes.length > 0) {
        participanteInfo = participantes[0];
        
        // Obtener inscripciones a talleres
        const [talleresInscritos] = await db.query(
          `SELECT i.id as inscripcion_id, i.taller_id, t.nombre, t.descripcion, t.horario, t.fecha, t.cupo
           FROM inscripciones i
           JOIN talleres t ON i.taller_id = t.id
           WHERE i.participante_id = ?`,
          [participanteInfo.id]
        );
        
        // Obtener inscripciones a competencias
        const [competenciasInscritas] = await db.query(
          `SELECT ic.id as inscripcion_id, ic.competencia_id, c.nombre, c.descripcion, c.horario, c.fecha, c.cupo
           FROM inscripciones_competencias ic
           JOIN competencias c ON ic.competencia_id = c.id
           WHERE ic.participante_id = ?`,
          [participanteInfo.id]
        );
        
        inscripciones = {
          talleres: talleresInscritos,
          competencias: competenciasInscritas
        };
      }
    } catch (err) {
      console.error("Error al buscar inscripciones:", err);
      // No fallar el login si hay error en las inscripciones
    }

    // Simulamos sesión guardando en localStorage desde el frontend
    return Response.json({
      message: "Inicio de sesión exitoso",
      user: {
        id: user.id,
        nombre: user.nombre,
        correo: user.correo,
        rol: user.rol,
      },
      participante: participanteInfo,
      inscripciones: inscripciones
    });
  } catch (error) {
    console.error("Error en login:", error);
    return Response.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
