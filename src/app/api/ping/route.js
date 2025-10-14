// src/app/api/participantes/route.js
import db from "@/lib/db";

export async function GET(req) {
  const [rows] = await pool.query(
    'SELECT id, nombre, correo, colegio, telefono, tipo, creado_en FROM participantes ORDER BY creado_en DESC'
  );
  return new Response(JSON.stringify(rows), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function POST(req) {
  const { nombre, correo, colegio, telefono, tipo } = await req.json();
  // Valida campos básicos
  if (!correo || (tipo === 'externo' && (!nombre || !colegio || !telefono))) {
    return new Response(
      JSON.stringify({ error: 'Faltan datos obligatorios' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
  const [result] = await pool.execute(
    'INSERT INTO participantes (nombre, correo, colegio, telefono, tipo) VALUES (?, ?, ?, ?, ?)',
    [nombre || null, correo, colegio || null, telefono || null, tipo]
  );
  const nuevo = { id: result.insertId, nombre, correo, colegio, telefono, tipo };
  return new Response(JSON.stringify(nuevo), {
    status: 201,
    headers: { 'Content-Type': 'application/json' }
  });
}
