import { writeFile, mkdir, stat } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

// POST /api/upload
// - Usa form-data (campo "file")
// - Guarda en /public/uploads y devuelve { url }
export async function POST(request) {
  try {
    const form = await request.formData();
    const file = form.get('file');

    if (!file || typeof file === 'string') {
      return new Response(JSON.stringify({ error: 'Archivo "file" requerido (multipart/form-data).' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    try {
      await stat(uploadDir);
    } catch {
      await mkdir(uploadDir, { recursive: true });
    }

    // Tomar extensión desde el nombre original si existe
    const origName = file.name || 'upload.bin';
    const ext = origName.includes('.') ? `.${origName.split('.').pop()}` : '';
    const filename = `${crypto.randomBytes(16).toString('hex')}${ext}`;
    const filepath = path.join(uploadDir, filename);

    await writeFile(filepath, buffer);

    const publicUrl = `/uploads/${filename}`;
    return new Response(JSON.stringify({ url: publicUrl, name: filename }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error en /api/upload:', error);
    return new Response(JSON.stringify({ error: 'Error al subir el archivo.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
