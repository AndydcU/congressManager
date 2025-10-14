# MIGRACIÓN DE BASE DE DATOS COMPLETADA

## Resumen de Cambios

Se ha completado la actualización de todas las rutas API del backend para adaptarse a la nueva estructura de base de datos MySQL.

### Cambios Principales en la Base de Datos

1. **Eliminación de tabla `participantes`**
   - Toda la información migrada a tabla `usuarios`
   - Campo `qr_token` agregado a `usuarios`
   
2. **Unificación de asistencias**
   - Tabla `asistencia_general` ahora soporta 3 tipos:
     - `general` - Asistencia al congreso
     - `taller` - Asistencia a talleres específicos
     - `competencia` - Asistencia a competencias específicas

3. **Campos simplificados**
   - `precio` y `costo` → unificado a `costo`
   - `fecha_realizacion` y `fecha` → unificado a `fecha`
   - Campo `participante_id` eliminado de todas las tablas

## Archivos API Actualizados

### ✅ src/app/api/usuarios/route.js
**Cambios:**
- Eliminada referencia a tabla `participantes`
- Usuario se crea directamente en tabla `usuarios` con todos los campos
- Generación automática de `qr_token` único
- Agregado método GET para obtener usuarios

**Campos nuevos:**
```javascript
{
  qr_token: "token_generado_automáticamente",
  tipo_usuario: "interno/externo",
  activo: 1
}
```

### ✅ src/app/api/talleres/route.js
**Cambios:**
- Consulta actualizada para usar campo `inscritos` de la tabla
- Eliminadas referencias a `participante_id`
- Campo `costo` en lugar de `precio`
- Soft delete con campo `activo`

**Query GET:**
```sql
SELECT t.*, t.inscritos as participantes_inscritos
FROM talleres t
WHERE t.activo = 1
```

### ✅ src/app/api/competencias/route.js
**Cambios:**
- Consulta actualizada para usar campo `inscritos` de la tabla
- Eliminadas referencias a `participante_id`
- Campo `costo` en lugar de `precio`
- Soft delete con campo `activo`

**Query GET:**
```sql
SELECT c.*, c.inscritos as participantes_inscritos
FROM competencias c
WHERE c.activo = 1
```

### ✅ src/app/api/inscripciones/route.js
**Cambios:**
- `participante_id` → `usuario_id`
- JOIN con tabla `usuarios` en lugar de `participantes`
- Campo `estado` agregado (pendiente/confirmada/cancelada)

**Query GET:**
```sql
SELECT i.id, i.taller_id, t.nombre, t.horario, t.fecha, i.estado, i.fecha_inscripcion
FROM inscripciones i
JOIN talleres t ON i.taller_id = t.id
WHERE i.usuario_id = ?
```

### ✅ src/app/api/inscripciones-competencias/route.js
**Cambios:**
- `participante_id` → `usuario_id` 
- Eliminado campo `participante_id` por completo
- JOIN con tabla `usuarios` en lugar de `participantes`
- Campo `estado` agregado

**Query GET (por competencia):**
```sql
SELECT ic.id, ic.usuario_id, u.nombre, u.colegio, u.correo, u.telefono, u.tipo_usuario, ic.estado, ic.registrado_en
FROM inscripciones_competencias ic
INNER JOIN usuarios u ON u.id = ic.usuario_id
WHERE ic.competencia_id = ?
```

### ✅ src/app/api/asistencia/route.js
**Cambios completos:**
- Nueva estructura con tabla unificada `asistencia_general`
- Soporte para 3 tipos: `general`, `taller`, `competencia`
- JOIN con `usuarios`, `talleres` y `competencias`

**Query GET:**
```sql
SELECT ag.id, ag.usuario_id, u.nombre, u.tipo_usuario, ag.tipo, ag.actividad_id,
  CASE 
    WHEN ag.tipo = 'taller' THEN t.nombre
    WHEN ag.tipo = 'competencia' THEN c.nombre
    ELSE 'Asistencia General'
  END as actividad,
  ag.registrado_en
FROM asistencia_general ag
JOIN usuarios u ON u.id = ag.usuario_id
LEFT JOIN talleres t ON ag.tipo = 'taller' AND t.id = ag.actividad_id
LEFT JOIN competencias c ON ag.tipo = 'competencia' AND c.id = ag.actividad_id
```

**POST Body:**
```javascript
{
  usuario_id: number,
  tipo: "general" | "taller" | "competencia",
  actividad_id: number (opcional para tipo 'general')
}
```

### ✅ src/app/api/pagos/route.js
**Cambios:**
- `participante_id` → `usuario_id`
- JOIN con tabla `usuarios`
- Soporte para `tipo_actividad: 'congreso'` agregado
- Validación mejorada de tipos de actividad

**Tipos de actividad soportados:**
```javascript
tipo_actividad: "taller" | "competencia" | "congreso"
```

### ✅ src/app/api/diplomas/route.js
**Cambios:**
- `participante_id` → `usuario_id`
- Query actualizada para buscar en tabla `usuarios`

**Query GET:**
```sql
SELECT id, tipo, taller_id, competencia_id, archivo_url, emitido_en
FROM diplomas 
WHERE usuario_id = ?
```

### ✅ src/app/api/resultados/route.js
**Cambios:**
- `participante_id` → `usuario_id`
- JOIN con tabla `usuarios`
- Campo `nombre_externo` eliminado (usar solo usuario_id)
- Campo `tipo_participante` ahora viene de usuarios.tipo_usuario

**Query GET:**
```sql
SELECT r.id, r.puesto, r.proyecto, r.descripcion, r.anio,
  c.id AS competencia_id, c.nombre AS competencia,
  r.usuario_id, u.nombre AS participante, u.tipo_usuario
FROM resultados_competencias r
JOIN competencias c ON c.id = r.competencia_id
LEFT JOIN usuarios u ON u.id = r.usuario_id
WHERE r.anio = ?
```

## Cambios en Referencias

### Antes (con participantes):
```javascript
// Inscripciones
{ participante_id, taller_id }

// Asistencia
SELECT * FROM asistencia WHERE participante_id = ?
SELECT * FROM asistencia_talleres WHERE participante_id = ?

// Resultados
{ participante_id, nombre_externo }
```

### Después (solo usuarios):
```javascript
// Inscripciones
{ usuario_id, taller_id }

// Asistencia unificada
SELECT * FROM asistencia_general 
WHERE usuario_id = ? AND tipo = 'general'

// Resultados
{ usuario_id } // nombre viene del JOIN
```

## Próximos Pasos Recomendados

1. **Actualizar Frontend:**
   - Cambiar todas las referencias de `participante_id` a `usuario_id`
   - Actualizar formularios para usar nueva estructura de asistencia
   - Verificar componentes que usen la API de asistencia

2. **Probar Funcionalidades:**
   - Registro de usuarios
   - Inscripciones a talleres y competencias
   - Sistema de asistencia (general/taller/competencia)
   - Generación de diplomas
   - Registro de resultados

3. **Verificar Migraciones:**
   - Confirmar que todos los datos se migraron correctamente
   - Validar que no haya referencias huérfanas
   - Verificar integridad referencial

4. **Eliminar Código Legacy:**
   - Buscar y eliminar referencias a `participante_id` en frontend
   - Remover archivos/routes de API de participantes si existen

## Notas Importantes

- ⚠️ La tabla `participantes` ya no existe en la BD
- ✅ Todos los datos de participantes deben estar en `usuarios`
- ✅ El campo `qr_token` se genera automáticamente al crear usuario
- ✅ Las asistencias ahora se registran en una sola tabla unificada
- ✅ Soft delete implementado en talleres y competencias (campo `activo`)

## Testing Checklist

- [ ] Crear nuevo usuario
- [ ] Inscribir usuario a taller
- [ ] Inscribir usuario a competencia
- [ ] Registrar asistencia general
- [ ] Registrar asistencia a taller
- [ ] Registrar asistencia a competencia
- [ ] Registrar pago
- [ ] Generar diploma
- [ ] Crear resultado de competencia
- [ ] Verificar listados y consultas

---

**Fecha de migración:** 14 de octubre, 2025  
**Estado:** ✅ COMPLETADO
