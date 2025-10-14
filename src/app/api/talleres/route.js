import db from "@/lib/db";

export async function GET() {
  try {
    // Get talleres with participant count
    const [rows] = await db.query(`
      SELECT 
        t.*,
        COALESCE(
          (SELECT COUNT(DISTINCT participante_id) 
           FROM inscripciones
           WHERE taller_id = t.id), 0
        ) as participantes_inscritos
      FROM talleres t
      ORDER BY t.creado_en DESC
    `);
    return Response.json(rows);
  } catch (error) {
    console.error("Error al obtener talleres:", error);
    // Return empty array instead of error to prevent page crash
    return Response.json([]);
  }
}

export async function POST(req) {
  try {
    const { nombre, descripcion, horario, cupo, fecha, lugar, precio, fecha_realizacion } = await req.json();
    if (!nombre) return Response.json({ error: "Nombre requerido" }, { status: 400 });

    const normalizedCupo = Number.isFinite(Number(cupo)) ? Number(cupo) : 0;
    const normalizedPrecio = Number.isFinite(Number(precio)) ? Number(precio) : 0;

    const [result] = await db.query(
      "INSERT INTO talleres (nombre, descripcion, horario, cupo, precio, fecha_realizacion, fecha, lugar) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [nombre, descripcion, horario, normalizedCupo, normalizedPrecio, fecha_realizacion || null, fecha || null, lugar || null]
    );

    return Response.json({ message: "Taller creado", id: result.insertId });
  } catch (error) {
    console.error("Error al crear taller:", error);
    return Response.json({ error: "Error al crear taller" }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const { id, nombre, descripcion, horario, cupo, precio, fecha_realizacion, fecha, lugar } = await req.json();
    if (!id || !nombre) return Response.json({ error: "ID y nombre requeridos" }, { status: 400 });

    const normalizedCupo = Number.isFinite(Number(cupo)) ? Number(cupo) : 0;
    const normalizedPrecio = Number.isFinite(Number(precio)) ? Number(precio) : 0;

    await db.query(
      "UPDATE talleres SET nombre = ?, descripcion = ?, horario = ?, cupo = ?, precio = ?, fecha_realizacion = ?, fecha = ?, lugar = ? WHERE id = ?",
      [nombre, descripcion, horario, normalizedCupo, normalizedPrecio, fecha_realizacion || null, fecha || null, lugar || null, id]
    );

    return Response.json({ message: "Taller actualizado" });
  } catch (error) {
    console.error("Error al actualizar taller:", error);
    return Response.json({ error: "Error al actualizar taller" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { id } = await req.json();
    if (!id) return Response.json({ error: "ID requerido" }, { status: 400 });

    await db.query("DELETE FROM talleres WHERE id = ?", [id]);

    return Response.json({ message: "Taller eliminado" });
  } catch (error) {
    console.error("Error al eliminar taller:", error);
    return Response.json({ error: "Error al eliminar taller" }, { status: 500 });
  }
}
