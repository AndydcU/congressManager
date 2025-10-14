import db from "@/lib/db";
import { enviarComprobantePago } from "@/lib/email";

export async function POST(req) {
  try {
    const { usuario_id, actividad_id, tipo_actividad, monto, metodo_pago } = await req.json();
    
    if (!usuario_id || !tipo_actividad || !monto) {
      return new Response(
        JSON.stringify({ error: "Datos incompletos para procesar el pago" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validar tipo_actividad
    if (!['taller', 'competencia', 'congreso'].includes(tipo_actividad)) {
      return new Response(
        JSON.stringify({ error: "Tipo de actividad inválido" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Si es taller o competencia, se requiere actividad_id
    if ((tipo_actividad === 'taller' || tipo_actividad === 'competencia') && !actividad_id) {
      return new Response(
        JSON.stringify({ error: "Se requiere actividad_id para pagos de taller o competencia" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Obtener información del usuario
    const [usuario] = await db.query(
      "SELECT nombre, correo FROM usuarios WHERE id = ?",
      [usuario_id]
    );

    if (!Array.isArray(usuario) || usuario.length === 0) {
      return new Response(
        JSON.stringify({ error: "Usuario no encontrado" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    let actividad = null;

    // Obtener información de la actividad si corresponde
    if (tipo_actividad === 'taller' && actividad_id) {
      const [taller] = await db.query("SELECT nombre FROM talleres WHERE id = ?", [actividad_id]);
      if (!Array.isArray(taller) || taller.length === 0) {
        return new Response(
          JSON.stringify({ error: "Taller no encontrado" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }
      actividad = taller[0];
    } else if (tipo_actividad === 'competencia' && actividad_id) {
      const [competencia] = await db.query("SELECT nombre FROM competencias WHERE id = ?", [actividad_id]);
      if (!Array.isArray(competencia) || competencia.length === 0) {
        return new Response(
          JSON.stringify({ error: "Competencia no encontrada" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }
      actividad = competencia[0];
    }

    // Verificar si ya existe un pago para esta actividad
    if (actividad_id) {
      const [pagoExistente] = await db.query(
        "SELECT id FROM pagos WHERE usuario_id = ? AND actividad_id = ? AND tipo_actividad = ?",
        [usuario_id, actividad_id, tipo_actividad]
      );

      if (Array.isArray(pagoExistente) && pagoExistente.length > 0) {
        return new Response(
          JSON.stringify({ error: "Ya existe un pago registrado para esta actividad" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Registrar el pago
    const estado = metodo_pago === 'efectivo' ? 'pendiente' : 'completado';
    
    const [result] = await db.query(
      "INSERT INTO pagos (usuario_id, actividad_id, tipo_actividad, monto, metodo_pago, estado) VALUES (?, ?, ?, ?, ?, ?)",
      [usuario_id, actividad_id || null, tipo_actividad, monto, metodo_pago || 'efectivo', estado]
    );

    // Enviar comprobante de pago por correo
    if (actividad) {
      const emailResult = await enviarComprobantePago({
        destinatario: usuario[0].correo,
        nombreParticipante: usuario[0].nombre,
        nombreActividad: actividad.nombre,
        tipoActividad: tipo_actividad,
        monto: monto,
        metodoPago: metodo_pago || 'efectivo',
      });

      if (!emailResult.success) {
        console.warn('⚠️ Pago registrado pero el comprobante no pudo ser enviado:', emailResult.error);
      }
    }

    return new Response(
      JSON.stringify({ 
        message: "Pago registrado exitosamente", 
        id: result.insertId,
        estado
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error al registrar pago:", error);
    return new Response(
      JSON.stringify({ error: "Error al procesar el pago" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const usuario_id = searchParams.get('usuario_id');
    const actividad_id = searchParams.get('actividad_id');
    const tipo_actividad = searchParams.get('tipo_actividad');

    let query = `
      SELECT p.*, 
             u.nombre as usuario_nombre,
             u.correo as usuario_correo
      FROM pagos p
      JOIN usuarios u ON p.usuario_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (usuario_id) {
      query += " AND p.usuario_id = ?";
      params.push(usuario_id);
    }

    if (actividad_id) {
      query += " AND p.actividad_id = ?";
      params.push(actividad_id);
    }

    if (tipo_actividad) {
      query += " AND p.tipo_actividad = ?";
      params.push(tipo_actividad);
    }

    query += " ORDER BY p.fecha_pago DESC";

    const [rows] = await db.query(query, params);
    return new Response(
      JSON.stringify(Array.isArray(rows) ? rows : []),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error al obtener pagos:", error);
    return new Response(
      JSON.stringify({ error: "Error al obtener pagos" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
