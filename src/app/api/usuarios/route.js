import db from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function POST(req) {
  try {
    const { 
      nombre, 
      correo, 
      password, 
      tipo_usuario, 
      colegio, 
      telefono, 
      grado, 
      carnet 
    } = await req.json();

    if (!nombre || !correo || !password || !tipo_usuario) {
      return new Response(
        JSON.stringify({ error: "Faltan datos obligatorios." }),
        { status: 400 }
      );
    }

    // Validar correo institucional para alumnos internos
    if (tipo_usuario === 'interno' && !correo.endsWith('@miumg.edu.gt')) {
      return new Response(
        JSON.stringify({ error: "Los alumnos internos deben usar su correo institucional (@miumg.edu.gt)" }),
        { status: 400 }
      );
    }

    // Validar que alumnos internos proporcionen carnet
    if (tipo_usuario === 'interno' && !carnet) {
      return new Response(
        JSON.stringify({ error: "El número de carnet es obligatorio para alumnos internos." }),
        { status: 400 }
      );
    }

    // Verificar si ya existe el correo
    const [existing] = await db.query(
      "SELECT id FROM usuarios WHERE correo = ?",
      [correo]
    );
    if (existing.length > 0) {
      return new Response(
        JSON.stringify({ error: "Este correo ya está registrado." }),
        { status: 409 }
      );
    }

    // Encriptar contraseña
    const hashed = await bcrypt.hash(password, 10);

    // Generar QR token único
    const qr_token = crypto.randomBytes(32).toString('hex');

    // Crear usuario con todos los datos
    const [userResult] = await db.execute(
      `INSERT INTO usuarios 
       (nombre, correo, contrasena, telefono, colegio, tipo_usuario, carnet, grado, qr_token, rol) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'usuario')`,
      [
        nombre, 
        correo, 
        hashed,
        telefono || null,
        tipo_usuario === 'externo' ? (colegio || null) : null,
        tipo_usuario,
        tipo_usuario === 'interno' ? (carnet || null) : null,
        tipo_usuario === 'interno' ? (grado || null) : null,
        qr_token
      ]
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: "Usuario registrado correctamente.",
        id: userResult.insertId,
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error("Error en registro:", error);
    return new Response(
      JSON.stringify({ error: "Error al registrar usuario." }),
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      const [rows] = await db.query(
        "SELECT id, nombre, correo, telefono, colegio, tipo_usuario, carnet, grado, qr_token, rol FROM usuarios WHERE id = ?",
        [id]
      );
      return new Response(
        JSON.stringify(rows[0] || null),
        { status: 200 }
      );
    }

    const [rows] = await db.query(
      "SELECT id, nombre, correo, telefono, colegio, tipo_usuario, carnet, grado, rol, creado_en FROM usuarios ORDER BY creado_en DESC"
    );
    return new Response(
      JSON.stringify(rows),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    return new Response(
      JSON.stringify({ error: "Error al obtener usuarios." }),
      { status: 500 }
    );
  }
}
