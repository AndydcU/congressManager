import db from "@/lib/db";

/* =========================================================
   GET /api/competencias → Lista todas las competencias
   POST /api/competencias → Crea una nueva competencia
   Requiere tabla `competencias` en la BD:

   CREATE TABLE competencias (
     id INT AUTO_INCREMENT PRIMARY KEY,
     nombre VARCHAR(100) NOT NULL,
     descripcion TEXT,
     horario VARCHAR(100),
     cupo INT DEFAULT 0,
     creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
========================================================= */

export async function GET() {
  try {
    // Get competencias with participant count
    const [rows] = await db.query(`
      SELECT 
        c.*,
        COALESCE(
          (SELECT COUNT(DISTINCT participante_id) 
           FROM inscripciones_competencias 
           WHERE competencia_id = c.id), 0
        ) as participantes_inscritos
      FROM competencias c
      ORDER BY c.creado_en DESC
    `);
    return new Response(JSON.stringify(Array.isArray(rows) ? rows : []), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error al obtener competencias:", error);
    // Return empty array instead of error to prevent page crash
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function POST(req) {
  try {
    const { nombre, descripcion, horario, cupo, fecha, lugar, precio, fecha_realizacion } = await req.json();
    if (!nombre) {
      return new Response(
        JSON.stringify({ error: "Nombre requerido" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const normalizedCupo = Number.isFinite(Number(cupo)) ? Number(cupo) : 0;
    const normalizedPrecio = Number.isFinite(Number(precio)) ? Number(precio) : 0;

    const [result] = await db.query(
      "INSERT INTO competencias (nombre, descripcion, horario, cupo, precio, fecha_realizacion, fecha, lugar) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [nombre, descripcion || null, horario || null, normalizedCupo, normalizedPrecio, fecha_realizacion || null, fecha || null, lugar || null]
    );

    return new Response(
      JSON.stringify({ message: "Competencia creada", id: result.insertId }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error al crear competencia:", error);
    return new Response(
      JSON.stringify({ error: "Error al crear competencia" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function PUT(req) {
  try {
    const { id, nombre, descripcion, horario, cupo, precio, fecha_realizacion, fecha, lugar } = await req.json();
    if (!id || !nombre) {
      return new Response(
        JSON.stringify({ error: "ID y nombre requeridos" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const normalizedCupo = Number.isFinite(Number(cupo)) ? Number(cupo) : 0;
    const normalizedPrecio = Number.isFinite(Number(precio)) ? Number(precio) : 0;

    await db.query(
      "UPDATE competencias SET nombre = ?, descripcion = ?, horario = ?, cupo = ?, precio = ?, fecha_realizacion = ?, fecha = ?, lugar = ? WHERE id = ?",
      [nombre, descripcion || null, horario || null, normalizedCupo, normalizedPrecio, fecha_realizacion || null, fecha || null, lugar || null, id]
    );

    return new Response(
      JSON.stringify({ message: "Competencia actualizada" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error al actualizar competencia:", error);
    return new Response(
      JSON.stringify({ error: "Error al actualizar competencia" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function DELETE(req) {
  try {
    const { id } = await req.json();
    if (!id) {
      return new Response(
        JSON.stringify({ error: "ID requerido" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    await db.query("DELETE FROM competencias WHERE id = ?", [id]);

    return new Response(
      JSON.stringify({ message: "Competencia eliminada" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error al eliminar competencia:", error);
    return new Response(
      JSON.stringify({ error: "Error al eliminar competencia" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
