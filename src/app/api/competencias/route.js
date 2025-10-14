import db from "@/lib/db";

export async function GET() {
  try {
    const [rows] = await db.query(`
      SELECT 
        c.*,
        COUNT(DISTINCT ic.id) as inscritos
      FROM competencias c
      LEFT JOIN inscripciones_competencias ic ON ic.competencia_id = c.id
      WHERE c.activo = 1
      GROUP BY c.id
      ORDER BY c.creado_en DESC
    `);
    return new Response(JSON.stringify(Array.isArray(rows) ? rows : []), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error al obtener competencias:", error);
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function POST(req) {
  try {
    const data = await req.json();
    const { nombre, descripcion, hora_inicio, hora_fin, cupo, fecha, lugar } = data;
    const costo = data.costo ?? data.precio ?? 0;

    if (!nombre) {
      return new Response(
        JSON.stringify({ error: "Nombre requerido" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const normalizedCupo = Number.isFinite(Number(cupo)) ? Number(cupo) : 0;
    const normalizedCosto = Number.isFinite(Number(costo)) ? Number(costo) : 0;

    const [result] = await db.query(
      "INSERT INTO competencias (nombre, descripcion, hora_inicio, hora_fin, cupo, costo, fecha, lugar) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [nombre, descripcion || null, hora_inicio || null, hora_fin || null, normalizedCupo, normalizedCosto, fecha || null, lugar || null]
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
    const data = await req.json();
    const { id, nombre, descripcion, hora_inicio, hora_fin, cupo, fecha, lugar } = data;
    const costo = data.costo ?? data.precio ?? 0;

    if (!id || !nombre) {
      return new Response(
        JSON.stringify({ error: "ID y nombre requeridos" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const [current] = await db.query("SELECT fecha FROM competencias WHERE id = ?", [id]);
    if (current.length === 0) {
      return new Response(
        JSON.stringify({ error: "Competencia no encontrada" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const normalizedCupo = Number.isFinite(Number(cupo)) ? Number(cupo) : 0;
    const normalizedCosto = Number.isFinite(Number(costo)) ? Number(costo) : 0;
    const finalFecha = fecha || current[0].fecha;

    await db.query(
      "UPDATE competencias SET nombre = ?, descripcion = ?, hora_inicio = ?, hora_fin = ?, cupo = ?, costo = ?, fecha = ?, lugar = ? WHERE id = ?",
      [nombre, descripcion || null, hora_inicio || null, hora_fin || null, normalizedCupo, normalizedCosto, finalFecha, lugar || null, id]
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

    await db.query("UPDATE competencias SET activo = 0 WHERE id = ?", [id]);

    return new Response(
      JSON.stringify({ message: "Competencia desactivada" }),
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
