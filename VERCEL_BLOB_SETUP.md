# Configuración de Vercel Blob Storage para Diplomas

## Problema
En Vercel, el sistema de archivos es de **solo lectura** en producción, por lo que no se pueden guardar archivos PDF en `public/diplomas/` como se hace en desarrollo local.

## Solución
Se implementó **Vercel Blob Storage** para almacenar los diplomas en la nube.

## Pasos para Configurar en Vercel

### 1. Crear un Blob Store en Vercel

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto
3. Ve a la pestaña **Storage**
4. Haz clic en **Create Database**
5. Selecciona **Blob**
6. Dale un nombre (ejemplo: `congress-diplomas`)
7. Selecciona la región más cercana a tus usuarios
8. Haz clic en **Create**

### 2. Conectar el Blob Store al Proyecto

1. Después de crear el Blob Store, Vercel te pedirá conectarlo a un proyecto
2. Selecciona tu proyecto de Congress Manager
3. Haz clic en **Connect**

### 3. Variables de Entorno

Vercel agregará automáticamente la variable de entorno necesaria:
- `BLOB_READ_WRITE_TOKEN` - Token para leer y escribir en el Blob Storage

**No necesitas configurar nada manualmente**, Vercel lo hace automáticamente.

### 4. Redesplegar

Después de conectar el Blob Storage:
1. Ve a la pestaña **Deployments**
2. Haz clic en los 3 puntos del último deployment
3. Selecciona **Redeploy**
4. Marca la opción **Use existing build cache**
5. Haz clic en **Redeploy**

## Cómo Funciona

El código detecta automáticamente si está en Vercel o en desarrollo local:

- **En Vercel (Producción)**: 
  - Guarda diplomas en Vercel Blob Storage
  - Los archivos se almacenan en la nube
  - Se genera una URL pública para cada diploma

- **En Desarrollo Local**:
  - Guarda diplomas en `public/diplomas/`
  - Los archivos se almacenan en tu disco local
  - Funciona como antes sin cambios

## Verificar que Funciona

1. Después del redeploy, ve a tu aplicación en producción
2. Espera a que finalice un taller o competencia (o usa hora_fin en el pasado para pruebas)
3. El sistema automáticamente generará diplomas cada 5 minutos
4. Verifica en la base de datos que se crearon registros en la tabla `diplomas`
5. Las URLs en `archivo_url` serán URLs de Vercel Blob (ejemplo: `https://xxxxx.public.blob.vercel-storage.com/...`)

## Logs para Debugging

Puedes ver los logs en Vercel:
1. Ve a tu proyecto en Vercel
2. Pestaña **Deployments**
3. Click en el deployment actual
4. Pestaña **Functions**
5. Busca logs de las funciones `/api/diplomas/verificar-y-generar`

Deberías ver mensajes como:
- "Verificando actividades finalizadas..."
- "Talleres finalizados: X"
- "Diploma guardado en Vercel Blob: [URL]"

## Precio

Vercel Blob Storage incluye:
- **Hobby/Free**: 500 MB gratis
- **Pro**: 100 GB incluidos
- Después se cobra por GB adicional

Para diplomas PDF (típicamente 50-200 KB cada uno), 500 MB son suficientes para miles de diplomas.

## Troubleshooting

### Los diplomas no se generan
1. Verifica que el Blob Store esté conectado al proyecto
2. Verifica en los logs de Vercel si hay errores
3. Asegúrate de que `BLOB_READ_WRITE_TOKEN` esté en las variables de entorno

### Error "Access Denied"
- Asegúrate de que el Blob Store tenga acceso público habilitado
- Verifica que el token tenga permisos de lectura y escritura

### Los diplomas se generan pero no se pueden descargar
- Verifica que la URL en la base de datos sea accesible públicamente
- Prueba abrir la URL directamente en el navegador
