import db from "@/lib/db";

export async function GET() {
  try {
    const [rows] = await db.query(`
      SELECT 
        t.*,
        COUNT(DISTINCT i.id) as inscritos
      FROM talleres t
      LEFT JOIN inscripciones i ON i.taller_id = t.id
      WHERE t.activo = 1
      GROUP BY t.id
      ORDER BY t.creado_en DESC
    `);
    return Response.json(Array.isArray(rows) ? rows : []);
  } catch (error) {
    console.error("Error al obtener talleres:", error);
    return Response.json([]);
  }
}

export async function POST(req) {
  try {
    const data = await req.json();
    const { nombre, descripcion, hora_inicio, hora_fin, cupo, fecha, lugar } = data;
    const costo = data.costo ?? data.precio ?? 0;

    if (!nombre) return Response.json({ error: "Nombre requerido" }, { status: 400 });

    const normalizedCupo = Number.isFinite(Number(cupo)) ? Number(cupo) : 0;
    const normalizedCosto = Number.isFinite(Number(costo)) ? Number(costo) : 0;

    const [result] = await db.query(
      "INSERT INTO talleres (nombre, descripcion, hora_inicio, hora_fin, cupo, costo, fecha, lugar) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [nombre, descripcion, hora_inicio || null, hora_fin || null, normalizedCupo, normalizedCosto, fecha || null, lugar || null]
    );

    return Response.json({ message: "Taller creado", id: result.insertId });
  } catch (error) {
    console.error("Error al crear taller:", error);
    return Response.json({ error: "Error al crear taller" }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const data = await req.json();
    const { id, nombre, descripcion, hora_inicio, hora_fin, cupo, fecha, lugar } = data;
    const costo = data.costo ?? data.precio ?? 0;

    if (!id || !nombre) return Response.json({ error: "ID y nombre requeridos" }, { status: 400 });

    const [current] = await db.query("SELECT fecha FROM talleres WHERE id = ?", [id]);
    if (current.length === 0) {
      return Response.json({ error: "Taller no encontrado" }, { status: 404 });
    }

    const normalizedCupo = Number.isFinite(Number(cupo)) ? Number(cupo) : 0;
    const normalizedCosto = Number.isFinite(Number(costo)) ? Number(costo) : 0;
    const finalFecha = fecha || current[0].fecha;

    await db.query(
      "UPDATE talleres SET nombre = ?, descripcion = ?, hora_inicio = ?, hora_fin = ?, cupo = ?, costo = ?, fecha = ?, lugar = ? WHERE id = ?",
      [nombre, descripcion, hora_inicio || null, hora_fin || null, normalizedCupo, normalizedCosto, finalFecha, lugar || null, id]
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

    await db.query("UPDATE talleres SET activo = 0 WHERE id = ?", [id]);

    return Response.json({ message: "Taller desactivado" });
  } catch (error) {
    console.error("Error al eliminar taller:", error);
    return Response.json({ error: "Error al eliminar taller" }, { status: 500 });
  }
}
