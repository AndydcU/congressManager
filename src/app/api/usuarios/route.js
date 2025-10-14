import db from "@/lib/db";
import bcrypt from "bcryptjs";

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

    // 🔍 Verificar si ya existe el correo
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

    // 🔒 Encriptar contraseña
    const hashed = await bcrypt.hash(password, 10);

    // 🧾 Crear usuario
    const [userResult] = await db.execute(
      "INSERT INTO usuarios (nombre, correo, contrasena, rol) VALUES (?, ?, ?, 'usuario')",
      [nombre, correo, hashed]
    );

    // 👤 Crear registro en participantes vinculado
    await db.execute(
      "INSERT INTO participantes (nombre, correo, colegio, telefono, tipo, carnet, grado) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        nombre, 
        correo, 
        tipo_usuario === 'externo' ? (colegio || "") : "", 
        telefono || "", 
        tipo_usuario,
        tipo_usuario === 'interno' ? (carnet || "") : "",
        tipo_usuario === 'interno' ? (grado || "") : ""
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
