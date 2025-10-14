import db from "@/lib/db";
import { enviarComprobantePago } from "@/lib/email";

/* =========================================================
   POST /api/pagos → Registra un pago
   GET /api/pagos → Lista pagos (con filtro opcional por participante)
   
   Requiere tabla `pagos` en la BD:

   CREATE TABLE pagos (
     id INT AUTO_INCREMENT PRIMARY KEY,
     participante_id INT NOT NULL,
     actividad_id INT NOT NULL,
     tipo_actividad ENUM('taller', 'competencia') NOT NULL,
     monto DECIMAL(10,2) NOT NULL,
     metodo_pago ENUM('efectivo', 'transferencia', 'tarjeta') NOT NULL,
     estado ENUM('pendiente', 'completado', 'rechazado') DEFAULT 'completado',
     fecha_pago TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     FOREIGN KEY (participante_id) REFERENCES participantes(id)
   );
========================================================= */

export async function POST(req) {
  try {
    const { participante_id, actividad_id, tipo_actividad, monto, metodo_pago } = await req.json();
    
    if (!participante_id || !actividad_id || !tipo_actividad || !monto) {
      return new Response(
        JSON.stringify({ error: "Datos incompletos para procesar el pago" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Obtener información del participante
    const [participante] = await db.query(
      "SELECT nombre, correo FROM participantes WHERE id = ?",
      [participante_id]
    );

    if (!Array.isArray(participante) || participante.length === 0) {
      return new Response(
        JSON.stringify({ error: "Participante no encontrado" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Obtener información de la actividad
    const tablaActividad = tipo_actividad === 'taller' ? 'talleres' : 'competencias';
    const [actividad] = await db.query(
      `SELECT nombre FROM ${tablaActividad} WHERE id = ?`,
      [actividad_id]
    );

    if (!Array.isArray(actividad) || actividad.length === 0) {
      return new Response(
        JSON.stringify({ error: "Actividad no encontrada" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Verificar si ya existe un pago para esta actividad
    const [pagoExistente] = await db.query(
      "SELECT id FROM pagos WHERE participante_id = ? AND actividad_id = ? AND tipo_actividad = ?",
      [participante_id, actividad_id, tipo_actividad]
    );

    if (Array.isArray(pagoExistente) && pagoExistente.length > 0) {
      return new Response(
        JSON.stringify({ error: "Ya existe un pago registrado para esta actividad" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Registrar el pago
    const estado = metodo_pago === 'efectivo' ? 'pendiente' : 'completado';
    
    const [result] = await db.query(
      "INSERT INTO pagos (participante_id, actividad_id, tipo_actividad, monto, metodo_pago, estado) VALUES (?, ?, ?, ?, ?, ?)",
      [participante_id, actividad_id, tipo_actividad, monto, metodo_pago, estado]
    );

    // Enviar comprobante de pago por correo
    const emailResult = await enviarComprobantePago({
      destinatario: participante[0].correo,
      nombreParticipante: participante[0].nombre,
      nombreActividad: actividad[0].nombre,
      tipoActividad: tipo_actividad,
      monto: monto,
      metodoPago: metodo_pago,
    });

    if (!emailResult.success) {
      console.warn('⚠️ Pago registrado pero el comprobante no pudo ser enviado:', emailResult.error);
    }

    return new Response(
      JSON.stringify({ 
        message: "Pago registrado exitosamente", 
        id: result.insertId,
        estado,
        comprobanteEnviado: emailResult.success
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
    const participante_id = searchParams.get('participante_id');
    const actividad_id = searchParams.get('actividad_id');
    const tipo_actividad = searchParams.get('tipo_actividad');

    let query = `
      SELECT p.*, 
             part.nombre as participante_nombre,
             part.correo as participante_correo
      FROM pagos p
      JOIN participantes part ON p.participante_id = part.id
      WHERE 1=1
    `;
    const params = [];

    if (participante_id) {
      query += " AND p.participante_id = ?";
      params.push(participante_id);
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
