# Sistema de Diplomas Automáticos - Guía de Implementación

**Fecha:** 14 de Octubre, 2025  
**Estado:** Requiere implementación con sistema de tareas programadas

## 📋 Descripción del Sistema

El sistema debe otorgar diplomas automáticamente a los participantes que:
1. Estén inscritos en un taller o competencia
2. Hayan registrado su asistencia
3. La actividad haya finalizado (fecha + horario final)

## 🎯 Requisitos Técnicos

### Problema Principal
Next.js no tiene un sistema nativo de tareas programadas (cron jobs). Se necesita una solución externa.

### Soluciones Propuestas

#### Opción 1: Cron Job Externo (Recomendado para Producción)
```bash
# Configurar en el servidor con crontab
# Ejecutar cada hora
0 * * * * curl -X POST https://tu-dominio.com/api/diplomas/auto-asignar
```

#### Opción 2: Vercel Cron Jobs (Si usas Vercel)
```json
// vercel.json
{
  "crons": [{
    "path": "/api/diplomas/auto-asignar",
    "schedule": "0 * * * *"
  }]
}
```

#### Opción 3: GitHub Actions (Gratis)
```yaml
# .github/workflows/auto-diplomas.yml
name: Auto Asignar Diplomas
on:
  schedule:
    - cron: '0 * * * *'  # Cada hora
jobs:
  assign:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger diploma assignment
        run: |
          curl -X POST https://tu-dominio.com/api/diplomas/auto-asignar \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

#### Opción 4: Worker Process (Node.js)
```javascript
// worker.js - Ejecutar con pm2 o similar
const cron = require('node-cron');

cron.schedule('0 * * * *', async () => {
  await fetch('http://localhost:3000/api/diplomas/auto-asignar', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer tu-secret' }
  });
});
```

## 📁 Estructura de Archivos a Crear

### 1. API Route: `/api/diplomas/auto-asignar/route.js`

```javascript
import db from "@/lib/db";
import { enviarDiploma } from "@/lib/email";

export async function POST(req) {
  try {
    // Verificar autorización
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return Response.json({ error: 'No autorizado' }, { status: 401 });
    }

    const ahora = new Date();
    const fechaHoy = ahora.toISOString().split('T')[0];
    const horaActual = ahora.toTimeString().split(' ')[0].substring(0, 5);

    // 1. Buscar talleres que ya finalizaron
    const [talleresFinalizados] = await db.query(`
      SELECT 
        t.id,
        t.nombre,
        t.fecha_realizacion,
        t.horario
      FROM talleres t
      WHERE t.fecha_realizacion = ?
      AND t.horario IS NOT NULL
      AND SUBSTRING_INDEX(t.horario, '-', -1) <= ?
    `, [fechaHoy, horaActual]);

    // 2. Buscar competencias que ya finalizaron
    const [competenciasFinalizadas] = await db.query(`
      SELECT 
        c.id,
        c.nombre,
        c.fecha_realizacion,
        c.horario
      FROM competencias c
      WHERE c.fecha_realizacion = ?
      AND c.horario IS NOT NULL
      AND SUBSTRING_INDEX(c.horario, '-', -1) <= ?
    `, [fechaHoy, horaActual]);

    let diplomasGenerados = 0;

    // 3. Procesar talleres
    for (const taller of talleresFinalizados) {
      // Obtener participantes que asistieron
      const [asistentes] = await db.query(`
        SELECT DISTINCT
          p.id as participante_id,
          p.nombre,
          p.correo
        FROM asistencia_talleres at
        JOIN participantes p ON p.id = at.participante_id
        WHERE at.taller_id = ?
        AND DATE(at.registrado_en) = ?
      `, [taller.id, fechaHoy]);

      // Generar diplomas
      for (const participante of asistentes) {
        // Verificar si ya tiene diploma
        const [existente] = await db.query(
          'SELECT id FROM diplomas WHERE participante_id = ? AND tipo = ? AND actividad_id = ?',
          [participante.participante_id, 'taller', taller.id]
        );

        if (existente.length === 0) {
          // Crear diploma
          await db.query(
            'INSERT INTO diplomas (participante_id, tipo, actividad_id, nombre_actividad, fecha_emision) VALUES (?, ?, ?, ?, NOW())',
            [participante.participante_id, 'taller', taller.id, taller.nombre]
          );

          // Enviar por correo (opcional)
          try {
            await enviarDiploma(participante.correo, participante.nombre, taller.nombre, 'Taller');
          } catch (emailError) {
            console.error('Error enviando diploma:', emailError);
          }

          diplomasGenerados++;
        }
      }
    }

    // 4. Procesar competencias
    for (const competencia of competenciasFinalizadas) {
      const [asistentes] = await db.query(`
        SELECT DISTINCT
          p.id as participante_id,
          p.nombre,
          p.correo
        FROM asistencia_competencias ac
        JOIN participantes p ON p.id = ac.participante_id
        WHERE ac.competencia_id = ?
        AND DATE(ac.registrado_en) = ?
      `, [competencia.id, fechaHoy]);

      for (const participante of asistentes) {
        const [existente] = await db.query(
          'SELECT id FROM diplomas WHERE participante_id = ? AND tipo = ? AND actividad_id = ?',
          [participante.participante_id, 'competencia', competencia.id]
        );

        if (existente.length === 0) {
          await db.query(
            'INSERT INTO diplomas (participante_id, tipo, actividad_id, nombre_actividad, fecha_emision) VALUES (?, ?, ?, ?, NOW())',
            [participante.participante_id, 'competencia', competencia.id, competencia.nombre]
          );

          try {
            await enviarDiploma(participante.correo, participante.nombre, competencia.nombre, 'Competencia');
          } catch (emailError) {
            console.error('Error enviando diploma:', emailError);
          }

          diplomasGenerados++;
        }
      }
    }

    return Response.json({
      success: true,
      diplomasGenerados,
      talleresProcessed: talleresFinalizados.length,
      competenciasProcessed: competenciasFinalizadas.length
    });

  } catch (error) {
    console.error('Error en auto-asignación de diplomas:', error);
    return Response.json({ error: 'Error interno' }, { status: 500 });
  }
}
```

### 2. Actualizar tabla de diplomas

```sql
-- Añadir campos necesarios a la tabla diplomas
ALTER TABLE diplomas 
ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) AFTER participante_id,
ADD COLUMN IF NOT EXISTS actividad_id INT AFTER tipo,
ADD COLUMN IF NOT EXISTS nombre_actividad VARCHAR(200) AFTER actividad_id,
ADD COLUMN IF NOT EXISTS fecha_emision TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER nombre_actividad;

-- Crear índice para evitar duplicados
CREATE UNIQUE INDEX IF NOT EXISTS idx_diploma_unico 
ON diplomas(participante_id, tipo, actividad_id);
```

### 3. Variable de Entorno

Agregar a `.env.local`:
```
CRON_SECRET=tu_secreto_super_seguro_aqui_cambiar
```

## 🔧 Pasos para Implementar

### Paso 1: Crear el Endpoint
1. Crear archivo `src/app/api/diplomas/auto-asignar/route.js`
2. Copiar el código proporcionado arriba
3. Ajustar según necesidades específicas

### Paso 2: Actualizar Base de Datos
```bash
mysql -u usuario -p base_datos < actualizacion_diplomas.sql
```

### Paso 3: Configurar Cron Job
Elegir una de las opciones según tu infraestructura:

#### Para Servidor Linux:
```bash
# Editar crontab
crontab -e

# Añadir línea (ejecutar cada hora)
0 * * * * curl -X POST https://tu-dominio.com/api/diplomas/auto-asignar \
  -H "Authorization: Bearer tu_secreto" \
  >> /var/log/diplomas-cron.log 2>&1
```

#### Para Vercel:
1. Crear `vercel.json` en la raíz del proyecto
2. Añadir configuración de cron
3. Desplegar

#### Para GitHub Actions:
1. Crear `.github/workflows/auto-diplomas.yml`
2. Añadir el secreto `CRON_SECRET` en Settings → Secrets
3. Push al repositorio

### Paso 4: Probar Manualmente
```bash
# Llamar al endpoint manualmente para probar
curl -X POST http://localhost:3000/api/diplomas/auto-asignar \
  -H "Authorization: Bearer tu_secreto"
```

## 📊 Monitoreo y Logs

### Crear tabla de logs (opcional)
```sql
CREATE TABLE diploma_cron_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ejecutado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  diplomas_generados INT,
  talleres_procesados INT,
  competencias_procesadas INT,
  errores TEXT,
  duracion_ms INT
);
```

### Añadir logging al endpoint
```javascript
const inicio = Date.now();
try {
  // ... código del endpoint ...
  
  await db.query(
    'INSERT INTO diploma_cron_logs (diplomas_generados, talleres_procesados, competencias_procesadas, duracion_ms) VALUES (?, ?, ?, ?)',
    [diplomasGenerados, talleresFinalizados.length, competenciasFinalizadas.length, Date.now() - inicio]
  );
} catch (error) {
  await db.query(
    'INSERT INTO diploma_cron_logs (errores) VALUES (?)',
    [error.message]
  );
}
```

## ⚠️ Consideraciones Importantes

### Seguridad
- Usar un `CRON_SECRET` fuerte y único
- No exponer el endpoint públicamente sin autenticación
- Verificar siempre el token de autorización

### Performance
- El endpoint puede tardar si hay muchos diplomas que generar
- Considerar procesar en lotes si hay > 100 participantes
- Usar transacciones para mantener consistencia

### Notificaciones
- Enviar email al administrador con resumen de ejecución
- Alert si falla el cron job
- Dashboard para ver histórico de ejecuciones

### Horarios
- Parsear correctamente el formato de horario (ej: "10:00 - 12:00")
- Considerar zona horaria del servidor
- Ejecutar con suficiente frecuencia (cada hora recomendado)

## 🎨 Mejoras Futuras

1. **Dashboard de Monitoreo**
   - Ver ejecuciones recientes
   - Estadísticas de diplomas generados
   - Alertas en tiempo real

2. **Reintento Automático**
   - Si falla el envío de email, reintentar
   - Cola de trabajos pendientes

3. **Diplomas Personalizados**
   - Plantillas diferentes por tipo de actividad
   - Incluir logotipos y firmas digitales
   - Generar PDF con diseño profesional

4. **Notificaciones Push**
   - Notificar al participante cuando recibe diploma
   - Integración con Telegram/WhatsApp

## 📞 Soporte

Para cualquier duda sobre la implementación, consultar:
- Documentación de Next.js sobre API Routes
- Documentación de Vercel Cron (si aplica)
- Logs del servidor para debugging

**Última actualización:** 14 de Octubre, 2025
