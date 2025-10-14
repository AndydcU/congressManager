# Mejoras al Sistema de Asistencia - Documentación

**Fecha:** 13 de Octubre, 2025  
**Versión:** 2.0

## 📋 Resumen de Cambios Implementados

Este documento detalla todas las mejoras realizadas al sistema de gestión de talleres, competencias y asistencia del congreso.

---

## 🎯 Funcionalidades Implementadas

### 1. ✅ Buscador en Registro de Asistencia

**Ubicación:** `src/app/asistencia/page.jsx`

**Descripción:** Se agregó un campo de búsqueda para filtrar asistencias en tiempo real.

**Características:**
- Búsqueda por nombre de participante
- Búsqueda por nombre de actividad (taller/competencia)
- Búsqueda por tipo de actividad
- Actualización instantánea de resultados

**Uso:**
```
Simplemente escriba en el campo de búsqueda y los resultados se filtrarán automáticamente.
```

---

### 2. ✅ Sistema de QR por Actividad

**Archivos Modificados:**
- `src/app/mi-perfil/page.jsx` - Genera QR específicos por taller/competencia
- `src/app/asistencia/page.jsx` - Escanea y procesa QR específicos
- `src/app/api/asistencia/route.js` - Registra asistencia por actividad

**Descripción:** Cada taller y competencia ahora genera su propio código QR único.

**Mejoras sobre el sistema anterior:**
- ✅ QR específico para cada taller inscrito
- ✅ QR específico para cada competencia inscrita
- ✅ Previene registro de asistencia en actividades no inscritas
- ✅ Evita duplicados por actividad y día
- ✅ Compatibilidad con QR generales (retrocompatibilidad)

**Formato del QR:**
```json
{
  "participante_id": 123,
  "tipo": "taller",  // o "competencia"
  "id": 5,  // ID del taller o competencia
  "timestamp": 1697234567890
}
```

**Ventajas:**
- Mayor control sobre la asistencia
- Registro separado por actividad
- Mejor trazabilidad
- Reportes más detallados

---

### 3. ✅ Exportación Mejorada de Asistencias

**Ubicación:** `src/app/asistencia/page.jsx`

**Campos agregados al export Excel:**
- ID de asistencia
- Nombre del participante
- Tipo de participante (interno/externo)
- **NUEVO:** Nombre de la actividad
- **NUEVO:** Tipo de actividad (taller/competencia)
- Fecha y hora de registro

**Ejemplo de datos exportados:**
```
| ID | Participante    | Tipo Participante | Actividad       | Tipo Actividad | Fecha         |
|----|----------------|-------------------|-----------------|----------------|---------------|
| 1  | Juan Pérez     | interno           | Python Básico   | 📚 Taller      | 13/10 10:30  |
| 2  | María López    | externo           | Robótica        | 🏆 Competencia | 13/10 11:45  |
```

---

### 4. ✅ Ocultar "Inscripción" para Administradores

**Ubicación:** `src/components/Navbar.jsx`

**Descripción:** Los administradores ya no ven el link de "Inscripción" en el navbar.

**Razón:** Los administradores no necesitan inscribirse en actividades, solo gestionarlas.

**Código implementado:**
```jsx
{user?.rol !== 'admin' && (
  <Link href="/inscripcion">Inscripción</Link>
)}
```

---

### 5. ✅ Campos de Fecha y Precio en Talleres/Competencias

**Ubicación:** `src/app/admin/talleres/page.jsx`

**Nuevos campos agregados:**
- **Precio (Q):** Costo del taller o competencia (requerido)
- **Fecha de Realización:** Fecha cuando se llevará a cabo la actividad (requerido)

**Tabla actualizada muestra:**
- ID
- Nombre
- **Fecha** (nueva columna)
- Horario
- **Precio** (nueva columna)
- Cupo
- Acciones

---

### 6. ✅ Edición y Eliminación de Talleres/Competencias

**Ubicación:** 
- Frontend: `src/app/admin/talleres/page.jsx`
- Backend: `src/app/api/talleres/route.js`, `src/app/api/competencias/route.js`

**Funcionalidades:**

#### Editar
- Click en botón "✏️ Editar"
- Pre-carga todos los datos actuales
- Permite modificar cualquier campo
- Validación de datos requeridos

#### Eliminar
- Click en botón "🗑️ Eliminar"
- Confirmación antes de eliminar
- Eliminación en cascada (elimina inscripciones relacionadas)

**Métodos HTTP agregados:**
- `PUT /api/talleres` - Actualizar taller
- `DELETE /api/talleres` - Eliminar taller
- `PUT /api/competencias` - Actualizar competencia
- `DELETE /api/competencias` - Eliminar competencia

---

## 📊 Cambios en Base de Datos

### Script de Migración: `database_migration_mejoras.sql`

**Ejecutar este script ANTES de usar las nuevas funcionalidades:**

```sql
-- 1. Agregar columnas a talleres
ALTER TABLE talleres 
ADD COLUMN IF NOT EXISTS precio DECIMAL(10,2) DEFAULT 0.00 AFTER cupo,
ADD COLUMN IF NOT EXISTS fecha_realizacion DATE AFTER precio;

-- 2. Agregar columnas a competencias
ALTER TABLE competencias 
ADD COLUMN IF NOT EXISTS precio DECIMAL(10,2) DEFAULT 0.00 AFTER cupo,
ADD COLUMN IF NOT EXISTS fecha_realizacion DATE AFTER precio;

-- 3. Crear tabla para asistencia de talleres
CREATE TABLE IF NOT EXISTS asistencia_talleres (
  id INT AUTO_INCREMENT PRIMARY KEY,
  participante_id INT NOT NULL,
  taller_id INT NOT NULL,
  registrado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (participante_id) REFERENCES participantes(id) ON DELETE CASCADE,
  FOREIGN KEY (taller_id) REFERENCES talleres(id) ON DELETE CASCADE,
  UNIQUE KEY unique_attendance (participante_id, taller_id)
);

-- 4. Crear tabla para asistencia de competencias
CREATE TABLE IF NOT EXISTS asistencia_competencias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  participante_id INT NOT NULL,
  competencia_id INT NOT NULL,
  registrado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (participante_id) REFERENCES participantes(id) ON DELETE CASCADE,
  FOREIGN KEY (competencia_id) REFERENCES competencias(id) ON DELETE CASCADE,
  UNIQUE KEY unique_attendance (participante_id, competencia_id)
);

-- 5. Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_taller_fecha ON talleres(fecha_realizacion);
CREATE INDEX IF NOT EXISTS idx_competencia_fecha ON competencias(fecha_realizacion);
CREATE INDEX IF NOT EXISTS idx_asistencia_talleres_fecha ON asistencia_talleres(registrado_en);
CREATE INDEX IF NOT EXISTS idx_asistencia_competencias_fecha ON asistencia_competencias(registrado_en);
```

### Estructura de Nuevas Tablas

#### asistencia_talleres
```
id (PK)
participante_id (FK -> participantes.id)
taller_id (FK -> talleres.id)
registrado_en (TIMESTAMP)
```

#### asistencia_competencias
```
id (PK)
participante_id (FK -> participantes.id)
competencia_id (FK -> competencias.id)
registrado_en (TIMESTAMP)
```

**Nota:** La tabla `asistencia` antigua se mantiene para retrocompatibilidad.

---

## 🔧 Pasos para Implementar

### 1. Ejecutar Migración de Base de Datos

```bash
# Conectarse a MySQL
mysql -u usuario -p nombre_bd

# Ejecutar el script
source database_migration_mejoras.sql

# O copiar y pegar el contenido del script
```

### 2. Verificar las Tablas

```sql
-- Verificar estructura de talleres
DESCRIBE talleres;

-- Verificar estructura de competencias
DESCRIBE competencias;

-- Verificar nuevas tablas
SHOW TABLES LIKE 'asistencia_%';
```

### 3. No se Requieren Cambios Adicionales

Todos los archivos de código ya están actualizados. El sistema funcionará automáticamente después de ejecutar la migración.

---

## 📱 Guía de Uso

### Para Participantes

#### Ver Códigos QR
1. Iniciar sesión
2. Ir a "Mi Perfil"
3. Ver la sección "Mis Inscripciones"
4. Cada taller/competencia mostrará su propio QR
5. Descargar QR individuales si es necesario

#### Registrar Asistencia
1. Presentar el QR del taller/competencia específico
2. El administrador escanea el código
3. El sistema registra la asistencia para esa actividad específica

### Para Administradores

#### Crear Taller/Competencia
1. Ir a "Panel Admin" → "Gestionar Talleres y Competencias"
2. Click en "+ Crear Taller" o "+ Crear Competencia"
3. Llenar todos los campos (precio y fecha son obligatorios)
4. Click en "Crear"

#### Editar Taller/Competencia
1. En la tabla, localizar el taller/competencia
2. Click en "✏️ Editar"
3. Modificar los campos necesarios
4. Click en "Actualizar"

#### Eliminar Taller/Competencia
1. En la tabla, localizar el taller/competencia
2. Click en "🗑️ Eliminar"
3. Confirmar la acción
4. **Advertencia:** Esto eliminará todas las inscripciones relacionadas

#### Registrar Asistencia
1. Ir a "Asistencia"
2. Click en "📷 Escanear asistencia"
3. Escanear QR del participante
4. Verificar mensaje de confirmación
5. Ver registro en la tabla

#### Buscar Asistencias
1. En la página de asistencia
2. Usar el campo de búsqueda en la parte superior derecha
3. Escribir nombre, actividad o tipo
4. Los resultados se filtran automáticamente

#### Exportar Asistencias
1. En la página de asistencia
2. Click en "📤 Exportar Asistencias"
3. Se descargará un archivo Excel con todos los datos

---

## 🎨 Mejoras Visuales

### Tabla de Asistencias
- Columnas más descriptivas
- Iconos para tipos de actividad (📚 Taller, 🏆 Competencia)
- Hover effects en filas
- Contador de resultados filtrados

### Formularios
- Campos claramente marcados como requeridos (*)
- Mejor organización en grid
- Validación en tiempo real
- Botones con acciones claras

### Códigos QR
- QR en miniatura en cada actividad
- Botón de descarga por separado
- Visual más compacto y organizado

---

## ⚠️ Consideraciones Importantes

### Seguridad
- Los QR incluyen timestamp para prevenir reutilización
- Validación de participante existe antes de registrar
- Validación de actividad existe antes de registrar
- Prevención de duplicados por día y actividad

### Performance
- Índices en campos de fecha para búsquedas rápidas
- Carga asíncrona de QR codes
- Actualización automática cada 15 segundos
- Filtrado en el cliente para respuesta inmediata

### Retrocompatibilidad
- El sistema antiguo de QR sigue funcionando
- La tabla `asistencia` se mantiene
- Los QR sin tipo/id se registran como antes

---

## 🐛 Solución de Problemas

### Error: "participante_id requerido"
**Causa:** QR code corrupto o formato incorrecto  
**Solución:** Regenerar QR desde "Mi Perfil"

### Error: "Ya registró asistencia"
**Causa:** Intento de escanear el mismo QR dos veces el mismo día  
**Solución:** Normal, el participante ya está registrado

### Error: "Taller/Competencia no encontrado"
**Causa:** El taller/competencia fue eliminado después de generar el QR  
**Solución:** El participante debe reinscribirse

### Las nuevas columnas no aparecen
**Causa:** No se ejecutó el script de migración  
**Solución:** Ejecutar `database_migration_mejoras.sql`

### Los QR no se generan
**Causa:** Falta inscripción o error en fetch  
**Solución:** Verificar que el participante esté inscrito

---

## 📈 Estadísticas y Reportes

### Datos Disponibles
- Asistencia total por actividad
- Asistencia por tipo de participante
- Asistencia por fecha
- Participantes más activos
- Actividades más populares

### Exportaciones
- Excel con todos los campos
- CSV desde panel admin
- Filtros por fecha disponibles

---

## 🔮 Futuras Mejoras Sugeridas

1. **Dashboard con gráficas**
   - Gráficas de asistencia por día
   - Comparativa talleres vs competencias
   - Métricas en tiempo real

2. **Notificaciones**
   - Email cuando se registra asistencia
   - Recordatorios de actividades próximas
   - Alertas de cambios en horarios

3. **Reportes PDF**
   - Certificados de asistencia personalizados
   - Reportes administrativos con logos
   - Estadísticas detalladas por actividad

4. **App Móvil**
   - Escaneo más rápido
   - Notificaciones push
   - Acceso offline a QR codes

---

## 📞 Contacto y Soporte

Para preguntas o problemas con el sistema, contactar al equipo de desarrollo.

**Última actualización:** 13 de Octubre, 2025
