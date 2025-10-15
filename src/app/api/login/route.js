import db from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const { correo, password } = await req.json();

    if (!correo || !password) {
      return Response.json({ error: "Correo y contraseña requeridos" }, { status: 400 });
    }

    const [rows] = await db.query(
      "SELECT id, nombre, correo, rol, tipo_usuario, carnet, grado, colegio, contrasena FROM usuarios WHERE correo = ?",
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

    // Obtener inscripciones del usuario
    let inscripciones = { talleres: [], competencias: [] };
    
    try {
      // Obtener inscripciones a talleres
      const [talleresInscritos] = await db.query(
        `SELECT i.id as inscripcion_id, i.taller_id, t.nombre, t.descripcion, t.hora_inicio, t.hora_fin, t.fecha, t.cupo
         FROM inscripciones i
         JOIN talleres t ON i.taller_id = t.id
         WHERE i.usuario_id = ?`,
        [user.id]
      );
      
      // Obtener inscripciones a competencias
      const [competenciasInscritas] = await db.query(
        `SELECT ic.id as inscripcion_id, ic.competencia_id, c.nombre, c.descripcion, c.hora_inicio, c.hora_fin, c.fecha, c.cupo
         FROM inscripciones_competencias ic
         JOIN competencias c ON ic.competencia_id = c.id
         WHERE ic.usuario_id = ?`,
        [user.id]
      );
      
      inscripciones = {
        talleres: talleresInscritos || [],
        competencias: competenciasInscritas || []
      };
    } catch (err) {
      console.error("Error al buscar inscripciones:", err);
      // No fallar el login si hay error en las inscripciones
    }

    // Retornar información del usuario
    return Response.json({
      message: "Inicio de sesión exitoso",
      user: {
        id: user.id,
        nombre: user.nombre,
        correo: user.correo,
        rol: user.rol,
        tipo_usuario: user.tipo_usuario,
        carnet: user.carnet,
        grado: user.grado,
        colegio: user.colegio
      },
      inscripciones: inscripciones
    });
  } catch (error) {
    console.error("Error en login:", error);
    return Response.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
