# Correcciones de Base de Datos - Horarios y Campos

## Resumen de Cambios Implementados

Se han realizado las correcciones necesarias en el frontend y backend del sistema Congreso UMG para adaptarse a los cambios en la estructura de la base de datos.

## 1. Cambios en Campos de Base de Datos

### Campo de Precio
- **Antes:** `precio` (VARCHAR)
- **Ahora:** `costo` (DECIMAL)
- **Ubicación:** Tablas `talleres` y `competencias`

### Campos de Horario
- **Antes:** `horario` (VARCHAR) - ejemplo: "10:00 - 12:00"
- **Ahora:** 
  - `hora_inicio` (TIME)
  - `hora_fin` (TIME)
- **Ubicación:** Tablas `talleres` y `competencias`

### Campo de Participante
- **Antes:** `participante_id` (referencia a tabla `participantes`)
- **Ahora:** `usuario_id` (referencia a tabla `usuarios`)
- **Ubicación:** Tablas `inscripciones`, `inscripciones_competencias`, `asistencia_general`

## 2. Archivos API Corregidos

### `/api/talleres/route.js`
- ✅ Acepta `costo` o `precio` en POST/PUT (compatibilidad)
- ✅ Inserta en campo `costo` de la BD
- ✅ Maneja `hora_inicio` y `hora_fin` en lugar de `horario`
- ✅ Preserva fecha existente al actualizar si no se envía nueva
- ✅ Devuelve arrays vacíos en lugar de null

### `/api/competencias/route.js`
- ✅ Acepta `costo` o `precio` en POST/PUT (compatibilidad)
- ✅ Inserta en campo `costo` de la BD
- ✅ Maneja `hora_inicio` y `hora_fin` en lugar de `horario`
- ✅ Preserva fecha existente al actualizar si no se envía nueva
- ✅ Devuelve arrays vacíos en lugar de null

### `/api/inscripciones/route.js`
- ✅ Usa `usuario_id` en lugar de `participante_id`
- ✅ SELECT incluye `hora_inicio`, `hora_fin` y `fecha`
- ✅ Construye horario como `hora_inicio - hora_fin` para emails
- ✅ Devuelve arrays vacíos en caso de error

### `/api/inscripciones-competencias/route.js`
- ✅ Usa `usuario_id` en lugar de `participante_id`
- ✅ SELECT incluye `hora_inicio`, `hora_fin` y `fecha`
- ✅ Construye horario como `hora_inicio - hora_fin` para emails
- ✅ Devuelve arrays vacíos en caso de error

## 3. Componentes Frontend Corregidos

### `/app/page.js` (Página Principal)
- ✅ Muestra `fecha` en formato legible
- ✅ Muestra horario como `hora_inicio - hora_fin`
- ✅ Valida arrays antes de usar .map()
- ✅ Usa campo `costo` en lugar de `precio`

### `/app/admin/talleres/page.jsx` (Panel Admin)
- ✅ Formulario usa inputs tipo `time` para hora_inicio y hora_fin
- ✅ Formulario usa campo `costo` en lugar de `precio`
- ✅ Muestra horarios como `hora_inicio - hora_fin` en tabla
- ✅ Al editar, carga correctamente los valores de hora_inicio y hora_fin
- ✅ Preserva fecha al actualizar

### `/app/inscripcion/page.jsx` (Inscripciones)
- ✅ Usa `usuario_id` en lugar de `participante_id`
- ✅ Muestra `costo` en lugar de `precio`
- ✅ Muestra horarios como `hora_inicio - hora_fin`
- ✅ Muestra fecha en formato legible
- ✅ Valida arrays antes de usar .map()

### `/app/talleresYcompetencias/page.jsx` (Listado)
- ✅ Usa `usuario_id` en lugar de `participante_id`
- ✅ Muestra `costo` en lugar de `precio`
- ✅ Muestra horarios como `hora_inicio - hora_fin`
- ✅ Muestra fecha en formato legible
- ✅ Valida arrays antes de usar .map()
- ✅ Maneja competencias además de talleres

## 4. Correcciones de Errores Comunes

### Error: "lista.map is not a function"
**Solución:** Validación de arrays en todos los componentes
```jsx
{Array.isArray(lista) ? lista.map(...) : <p>No hay registros</p>}
```

### Error: "No se encontró tu registro de participante"
**Solución:** Cambio de `participante_id` a `usuario_id` en todas las APIs y componentes

### Error: "Fecha se borra al actualizar"
**Solución:** Preservar fecha existente si no se envía nueva
```js
const finalFecha = fecha || current[0].fecha;
```

### Error: "Campo precio no existe"
**Solución:** Backend acepta ambos (`precio` o `costo`) pero siempre inserta en `costo`
```js
const costo = data.costo ?? data.precio ?? 0;
```

## 5. Características Implementadas

### Compatibilidad Backward
- El backend acepta tanto `precio` como `costo` en los endpoints
- Internamente siempre usa el campo `costo` de la BD

### Validaciones
- Arrays validados antes de .map()
- Valores numéricos normalizados con `Number.isFinite()`
- Fechas y horarios opcionales manejados correctamente

### Formato de Horarios
- Almacenamiento: Campos separados `hora_inicio` (TIME) y `hora_fin` (TIME)
- Visualización: Concatenados como "HH:MM - HH:MM"
- Formularios: Inputs tipo `time` para mejor UX

### Formato de Fechas
- Almacenamiento: Campo `fecha` (DATE)
- Visualización: `toLocaleDateString('es-GT')` para formato guatemalteco
- Formularios: Input tipo `date` para mejor UX

## 6. Testing Recomendado

1. **Crear Taller/Competencia:**
   - Verificar que se guardan hora_inicio, hora_fin, costo y fecha
   - Verificar visualización correcta en listados

2. **Editar Taller/Competencia:**
   - Verificar que la fecha no se borra si no se cambia
   - Verificar que los horarios se cargan correctamente en el formulario

3. **Inscripción:**
   - Verificar uso correcto de usuario_id
   - Verificar visualización de costo y horarios
   - Verificar que no hay errores de "participante no encontrado"

4. **Listados:**
   - Verificar que no hay errores ".map is not a function"
   - Verificar que se muestran fechas y horarios correctamente
   - Verificar arrays vacíos no causan errores

## 7. Archivos Modificados

### APIs (Backend)
- `src/app/api/talleres/route.js`
- `src/app/api/competencias/route.js`
- `src/app/api/inscripciones/route.js`
- `src/app/api/inscripciones-competencias/route.js`

### Componentes (Frontend)
- `src/app/page.js`
- `src/app/admin/talleres/page.jsx`
- `src/app/inscripcion/page.jsx`
- `src/app/talleresYcompetencias/page.jsx`

## 8. Notas Importantes

- La tabla `participantes` ya no se utiliza, todo se maneja con `usuarios`
- Los campos `horario` en tablas antiguas deben migrarse a `hora_inicio` y `hora_fin`
- El campo `precio` debe renombrarse a `costo` en la base de datos
- Los correos de confirmación ahora incluyen el horario formateado correctamente

---

**Fecha de corrección:** 14 de octubre de 2025
**Sistema:** Congreso UMG - Next.js + MySQL
