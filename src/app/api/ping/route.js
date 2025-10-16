import db from "@/lib/db";

export async function GET() {
  try {
    // Verificar variables de entorno
    const envCheck = {
      DB_HOST: !!process.env.DB_HOST,
      DB_USER: !!process.env.DB_USER,
      DB_PASSWORD: !!process.env.DB_PASSWORD,
      DB_NAME: !!process.env.DB_NAME,
    };

    // Intentar conexión a la base de datos
    const [rows] = await db.query('SELECT 1 as test');
    
    return Response.json({
      status: 'ok',
      message: 'Conexión a base de datos exitosa',
      environment: envCheck,
      dbTest: rows[0]
    });
  } catch (error) {
    return Response.json({
      status: 'error',
      message: 'Error de conexión a base de datos',
      error: error.message,
      environment: {
        DB_HOST: !!process.env.DB_HOST,
        DB_USER: !!process.env.DB_USER,
        DB_PASSWORD: !!process.env.DB_PASSWORD,
        DB_NAME: !!process.env.DB_NAME,
      }
    }, { status: 500 });
  }
}
