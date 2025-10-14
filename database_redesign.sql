-- ====================================================
-- REDISEÑO BASE DE DATOS: CONGRESO UMG
-- ====================================================
-- Descripción: Estructura optimizada con unificación de 
-- tablas participantes/usuarios y asistencia_general mejorada
-- ====================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET FOREIGN_KEY_CHECKS = 0;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

-- ====================================================
-- PASO 1: MIGRACIÓN DE DATOS (si existen participantes)
-- ====================================================

-- Migrar participantes a usuarios (solo si hay datos)
INSERT INTO `usuarios` (
    `nombre`, 
    `correo`, 
    `contrasena`, 
    `telefono`, 
    `colegio`, 
    `tipo_usuario`, 
    `carnet`, 
    `grado`, 
    `tipo`, 
    `rol`, 
    `creado_en`
)
SELECT 
    COALESCE(`nombre`, 'Usuario Migrado'),
    `correo`,
    MD5(CONCAT(`correo`, '_temp_password')), -- Contraseña temporal
    `telefono`,
    `colegio`,
    `tipo_usuario`,
    `carnet`,
    `grado`,
    `tipo`,
    'usuario' as rol,
    `creado_en`
FROM `participantes`
WHERE `correo` NOT IN (SELECT `correo` FROM `usuarios`)
ON DUPLICATE KEY UPDATE `nombre` = `nombre`;

-- Actualizar referencias de participante_id a usuario_id en inscripciones_competencias
UPDATE `inscripciones_competencias` ic
INNER JOIN `participantes` p ON ic.`participante_id` = p.`id`
INNER JOIN `usuarios` u ON p.`correo` = u.`correo`
SET ic.`usuario_id` = u.`id`
WHERE ic.`participante_id` > 0;

-- ====================================================
-- PASO 2: ELIMINACIÓN DE TABLAS ANTIGUAS
-- ====================================================

DROP TABLE IF EXISTS `asistencia_general`;
DROP TABLE IF EXISTS `diplomas`;
DROP TABLE IF EXISTS `resultados_competencias`;
DROP TABLE IF EXISTS `pagos`;
DROP TABLE IF EXISTS `inscripciones_competencias`;
DROP TABLE IF EXISTS `inscripciones`;
DROP TABLE IF EXISTS `competencias`;
DROP TABLE IF EXISTS `talleres`;
DROP TABLE IF EXISTS `participantes`;
DROP TABLE IF EXISTS `usuarios`;

-- ====================================================
-- PASO 3: CREACIÓN DE TABLAS NUEVAS
-- ====================================================

-- ----------------------------------------------------
-- Tabla: usuarios
-- Descripción: Usuarios del sistema (internos/externos)
-- ----------------------------------------------------
CREATE TABLE `usuarios` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(100) NOT NULL,
  `correo` VARCHAR(150) NOT NULL,
  `contrasena` VARCHAR(255) NOT NULL,
  `telefono` VARCHAR(20) DEFAULT NULL,
  `colegio` VARCHAR(150) DEFAULT NULL,
  `tipo_usuario` ENUM('interno','externo') NOT NULL DEFAULT 'externo',
  `carnet` VARCHAR(50) DEFAULT NULL,
  `grado` VARCHAR(100) DEFAULT NULL,
  `rol` ENUM('admin','usuario') NOT NULL DEFAULT 'usuario',
  `qr_token` VARCHAR(128) DEFAULT NULL,
  `activo` TINYINT(1) NOT NULL DEFAULT 1,
  `creado_en` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_usuarios_correo` (`correo`),
  UNIQUE KEY `uq_usuarios_qr_token` (`qr_token`),
  KEY `idx_usuarios_tipo` (`tipo_usuario`),
  KEY `idx_usuarios_rol` (`rol`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------
-- Tabla: talleres
-- Descripción: Talleres del congreso
-- ----------------------------------------------------
CREATE TABLE `talleres` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(150) NOT NULL,
  `descripcion` TEXT DEFAULT NULL,
  `token` VARCHAR(100) DEFAULT NULL,
  `fecha` DATE DEFAULT NULL,
  `horario` VARCHAR(100) DEFAULT NULL,
  `lugar` VARCHAR(255) DEFAULT NULL,
  `cupo` INT(11) NOT NULL DEFAULT 0,
  `inscritos` INT(11) NOT NULL DEFAULT 0,
  `costo` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `activo` TINYINT(1) NOT NULL DEFAULT 1,
  `creado_en` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_talleres_token` (`token`),
  KEY `idx_talleres_fecha` (`fecha`),
  KEY `idx_talleres_activo` (`activo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------
-- Tabla: competencias
-- Descripción: Competencias del congreso
-- ----------------------------------------------------
CREATE TABLE `competencias` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(100) NOT NULL,
  `descripcion` TEXT DEFAULT NULL,
  `token` VARCHAR(100) DEFAULT NULL,
  `fecha` DATE DEFAULT NULL,
  `horario` VARCHAR(100) DEFAULT NULL,
  `lugar` VARCHAR(255) DEFAULT NULL,
  `cupo` INT(11) NOT NULL DEFAULT 0,
  `inscritos` INT(11) NOT NULL DEFAULT 0,
  `costo` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `activo` TINYINT(1) NOT NULL DEFAULT 1,
  `creado_en` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_competencias_token` (`token`),
  KEY `idx_competencias_fecha` (`fecha`),
  KEY `idx_competencias_activo` (`activo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------
-- Tabla: inscripciones
-- Descripción: Inscripciones de usuarios a talleres
-- ----------------------------------------------------
CREATE TABLE `inscripciones` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` INT(11) NOT NULL,
  `taller_id` INT(11) NOT NULL,
  `token` VARCHAR(255) DEFAULT NULL,
  `estado` ENUM('pendiente','confirmada','cancelada') NOT NULL DEFAULT 'confirmada',
  `fecha_inscripcion` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_inscripciones` (`usuario_id`, `taller_id`),
  UNIQUE KEY `uq_inscripciones_token` (`token`),
  KEY `idx_inscripciones_taller` (`taller_id`),
  KEY `idx_inscripciones_estado` (`estado`),
  CONSTRAINT `fk_inscripciones_usuario` 
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_inscripciones_taller` 
    FOREIGN KEY (`taller_id`) REFERENCES `talleres` (`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------
-- Tabla: inscripciones_competencias
-- Descripción: Inscripciones de usuarios a competencias
-- ----------------------------------------------------
CREATE TABLE `inscripciones_competencias` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` INT(11) NOT NULL,
  `competencia_id` INT(11) NOT NULL,
  `token` VARCHAR(255) DEFAULT NULL,
  `estado` ENUM('pendiente','confirmada','cancelada') NOT NULL DEFAULT 'confirmada',
  `registrado_en` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_inscripciones_competencias` (`usuario_id`, `competencia_id`),
  UNIQUE KEY `uq_inscripciones_competencias_token` (`token`),
  KEY `idx_inscripciones_comp_competencia` (`competencia_id`),
  KEY `idx_inscripciones_comp_estado` (`estado`),
  CONSTRAINT `fk_inscripciones_comp_usuario` 
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_inscripciones_comp_competencia` 
    FOREIGN KEY (`competencia_id`) REFERENCES `competencias` (`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------
-- Tabla: asistencia_general
-- Descripción: Registro unificado de asistencias
-- Tipos: general (congreso), taller, competencia
-- ----------------------------------------------------
CREATE TABLE `asistencia_general` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` INT(11) NOT NULL,
  `tipo` ENUM('general','taller','competencia') NOT NULL,
  `actividad_id` INT(11) DEFAULT NULL,
  `notas` TEXT DEFAULT NULL,
  `registrado_en` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_asistencia` (`usuario_id`, `tipo`, `actividad_id`, DATE(`registrado_en`)),
  KEY `idx_asistencia_tipo` (`tipo`),
  KEY `idx_asistencia_actividad` (`actividad_id`),
  KEY `idx_asistencia_fecha` (`registrado_en`),
  CONSTRAINT `fk_asistencia_usuario` 
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------
-- Tabla: pagos
-- Descripción: Registro de pagos por actividades
-- ----------------------------------------------------
CREATE TABLE `pagos` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` INT(11) NOT NULL,
  `tipo_actividad` ENUM('taller','competencia','congreso') NOT NULL,
  `actividad_id` INT(11) DEFAULT NULL,
  `monto` DECIMAL(10,2) NOT NULL,
  `metodo_pago` ENUM('efectivo','transferencia','tarjeta','paypal') NOT NULL,
  `estado` ENUM('pendiente','completado','rechazado','reembolsado') NOT NULL DEFAULT 'pendiente',
  `referencia` VARCHAR(100) DEFAULT NULL,
  `comprobante_url` VARCHAR(255) DEFAULT NULL,
  `fecha_pago` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `verificado_en` TIMESTAMP NULL DEFAULT NULL,
  `verificado_por` INT(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_pagos_usuario` (`usuario_id`),
  KEY `idx_pagos_actividad` (`tipo_actividad`, `actividad_id`),
  KEY `idx_pagos_estado` (`estado`),
  KEY `idx_pagos_fecha` (`fecha_pago`),
  CONSTRAINT `fk_pagos_usuario` 
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_pagos_verificador` 
    FOREIGN KEY (`verificado_por`) REFERENCES `usuarios` (`id`) 
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------
-- Tabla: resultados_competencias
-- Descripción: Resultados y ganadores de competencias
-- ----------------------------------------------------
CREATE TABLE `resultados_competencias` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `competencia_id` INT(11) NOT NULL,
  `usuario_id` INT(11) DEFAULT NULL,
  `nombre_externo` VARCHAR(150) DEFAULT NULL,
  `puesto` INT(11) NOT NULL,
  `proyecto` VARCHAR(200) DEFAULT NULL,
  `descripcion` TEXT DEFAULT NULL,
  `foto_url` VARCHAR(255) DEFAULT NULL,
  `anio` INT(11) NOT NULL,
  `puntuacion` DECIMAL(5,2) DEFAULT NULL,
  `creado_en` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_resultado_competencia` (`competencia_id`, `puesto`, `anio`),
  KEY `idx_resultados_usuario` (`usuario_id`),
  KEY `idx_resultados_anio` (`anio`),
  KEY `idx_resultados_puesto` (`puesto`),
  CONSTRAINT `fk_resultados_competencia` 
    FOREIGN KEY (`competencia_id`) REFERENCES `competencias` (`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_resultados_usuario` 
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) 
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------
-- Tabla: diplomas
-- Descripción: Diplomas emitidos a usuarios
-- ----------------------------------------------------
CREATE TABLE `diplomas` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` INT(11) NOT NULL,
  `tipo` ENUM('asistencia','taller','competencia') NOT NULL,
  `taller_id` INT(11) DEFAULT NULL,
  `competencia_id` INT(11) DEFAULT NULL,
  `archivo_url` VARCHAR(255) NOT NULL,
  `codigo_verificacion` VARCHAR(100) DEFAULT NULL,
  `enviado` TINYINT(1) NOT NULL DEFAULT 0,
  `enviado_en` TIMESTAMP NULL DEFAULT NULL,
  `emitido_en` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_diploma` (`usuario_id`, `tipo`, `taller_id`, `competencia_id`),
  UNIQUE KEY `uq_diploma_codigo` (`codigo_verificacion`),
  KEY `idx_diplomas_taller` (`taller_id`),
  KEY `idx_diplomas_competencia` (`competencia_id`),
  KEY `idx_diplomas_tipo` (`tipo`),
  CONSTRAINT `fk_diplomas_usuario` 
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_diplomas_taller` 
    FOREIGN KEY (`taller_id`) REFERENCES `talleres` (`id`) 
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_diplomas_competencia` 
    FOREIGN KEY (`competencia_id`) REFERENCES `competencias` (`id`) 
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================
-- PASO 4: TRIGGERS PARA MANTENER CONTADORES
-- ====================================================

-- Trigger para actualizar contador de inscritos en talleres
DELIMITER $$
CREATE TRIGGER `trg_inscripciones_after_insert`
AFTER INSERT ON `inscripciones`
FOR EACH ROW
BEGIN
    IF NEW.estado = 'confirmada' THEN
        UPDATE `talleres` 
        SET `inscritos` = `inscritos` + 1 
        WHERE `id` = NEW.taller_id;
    END IF;
END$$

CREATE TRIGGER `trg_inscripciones_after_update`
AFTER UPDATE ON `inscripciones`
FOR EACH ROW
BEGIN
    IF OLD.estado != NEW.estado THEN
        IF NEW.estado = 'confirmada' AND OLD.estado != 'confirmada' THEN
            UPDATE `talleres` 
            SET `inscritos` = `inscritos` + 1 
            WHERE `id` = NEW.taller_id;
        ELSEIF NEW.estado != 'confirmada' AND OLD.estado = 'confirmada' THEN
            UPDATE `talleres` 
            SET `inscritos` = `inscritos` - 1 
            WHERE `id` = NEW.taller_id;
        END IF;
    END IF;
END$$

CREATE TRIGGER `trg_inscripciones_after_delete`
AFTER DELETE ON `inscripciones`
FOR EACH ROW
BEGIN
    IF OLD.estado = 'confirmada' THEN
        UPDATE `talleres` 
        SET `inscritos` = GREATEST(0, `inscritos` - 1) 
        WHERE `id` = OLD.taller_id;
    END IF;
END$$

-- Trigger para actualizar contador de inscritos en competencias
CREATE TRIGGER `trg_inscripciones_comp_after_insert`
AFTER INSERT ON `inscripciones_competencias`
FOR EACH ROW
BEGIN
    IF NEW.estado = 'confirmada' THEN
        UPDATE `competencias` 
        SET `inscritos` = `inscritos` + 1 
        WHERE `id` = NEW.competencia_id;
    END IF;
END$$

CREATE TRIGGER `trg_inscripciones_comp_after_update`
AFTER UPDATE ON `inscripciones_competencias`
FOR EACH ROW
BEGIN
    IF OLD.estado != NEW.estado THEN
        IF NEW.estado = 'confirmada' AND OLD.estado != 'confirmada' THEN
            UPDATE `competencias` 
            SET `inscritos` = `inscritos` + 1 
            WHERE `id` = NEW.competencia_id;
        ELSEIF NEW.estado != 'confirmada' AND OLD.estado = 'confirmada' THEN
            UPDATE `competencias` 
            SET `inscritos` = `inscritos` - 1 
            WHERE `id` = NEW.competencia_id;
        END IF;
    END IF;
END$$

CREATE TRIGGER `trg_inscripciones_comp_after_delete`
AFTER DELETE ON `inscripciones_competencias`
FOR EACH ROW
BEGIN
    IF OLD.estado = 'confirmada' THEN
        UPDATE `competencias` 
        SET `inscritos` = GREATEST(0, `inscritos` - 1) 
        WHERE `id` = OLD.competencia_id;
    END IF;
END$$

DELIMITER ;

-- ====================================================
-- PASO 5: VISTAS ÚTILES
-- ====================================================

-- Vista: Resumen de inscripciones por taller
CREATE OR REPLACE VIEW `v_talleres_resumen` AS
SELECT 
    t.id,
    t.nombre,
    t.fecha,
    t.cupo,
    t.inscritos,
    t.costo,
    (t.cupo - t.inscritos) as plazas_disponibles,
    ROUND((t.inscritos / t.cupo) * 100, 2) as porcentaje_ocupacion
FROM `talleres` t
WHERE t.activo = 1;

-- Vista: Resumen de inscripciones por competencia
CREATE OR REPLACE VIEW `v_competencias_resumen` AS
SELECT 
    c.id,
    c.nombre,
    c.fecha,
    c.cupo,
    c.inscritos,
    c.costo,
    (c.cupo - c.inscritos) as plazas_disponibles,
    ROUND((c.inscritos / c.cupo) * 100, 2) as porcentaje_ocupacion
FROM `competencias` c
WHERE c.activo = 1;

-- Vista: Asistencias por usuario
CREATE OR REPLACE VIEW `v_asistencias_usuario` AS
SELECT 
    u.id as usuario_id,
    u.nombre,
    u.correo,
    COUNT(DISTINCT CASE WHEN ag.tipo = 'general' THEN ag.id END) as asistencias_generales,
    COUNT(DISTINCT CASE WHEN ag.tipo = 'taller' THEN ag.id END) as asistencias_talleres,
    COUNT(DISTINCT CASE WHEN ag.tipo = 'competencia' THEN ag.id END) as asistencias_competencias,
    COUNT(DISTINCT ag.id) as total_asistencias
FROM `usuarios` u
LEFT JOIN `asistencia_general` ag ON u.id = ag.usuario_id
GROUP BY u.id, u.nombre, u.correo;

-- Vista: Estado de pagos por usuario
CREATE OR REPLACE VIEW `v_pagos_usuario` AS
SELECT 
    u.id as usuario_id,
    u.nombre,
    u.correo,
    COUNT(p.id) as total_pagos,
    SUM(CASE WHEN p.estado = 'completado' THEN p.monto ELSE 0 END) as total_pagado,
    SUM(CASE WHEN p.estado = 'pendiente' THEN p.monto ELSE 0 END) as total_pendiente
FROM `usuarios` u
LEFT JOIN `pagos` p ON u.id = p.usuario_id
GROUP BY u.id, u.nombre, u.correo;

-- ====================================================
-- PASO 6: ÍNDICES ADICIONALES PARA OPTIMIZACIÓN
-- ====================================================

-- Índices compuestos para consultas comunes
ALTER TABLE `asistencia_general` 
ADD INDEX `idx_asistencia_usuario_tipo` (`usuario_id`, `tipo`);

ALTER TABLE `pagos` 
ADD INDEX `idx_pagos_usuario_estado` (`usuario_id`, `estado`);

ALTER TABLE `diplomas` 
ADD INDEX `idx_diplomas_usuario_tipo` (`usuario_id`, `tipo`);

-- ====================================================
-- PASO 7: DATOS DE EJEMPLO (OPCIONAL)
-- ====================================================

-- Usuario administrador por defecto
INSERT INTO `usuarios` (`nombre`, `correo`, `contrasena`, `rol`, `tipo_usuario`) 
VALUES ('Administrador', 'admin@congreso.umg.edu.gt', MD5('admin123'), 'admin', 'interno')
ON DUPLICATE KEY UPDATE `rol` = 'admin';

-- ====================================================
-- FINALIZACIÓN
-- ====================================================

SET FOREIGN_KEY_CHECKS = 1;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

-- ====================================================
-- INSTRUCCIONES DE USO:
-- ====================================================
-- 1. Hacer backup de la base de datos actual
-- 2. Ejecutar este script completo
-- 3. Verificar que los datos se migraron correctamente
-- 4. Actualizar las aplicaciones para usar la nueva estructura
-- 
-- MEJORAS IMPLEMENTADAS:
-- - Eliminada tabla participantes (todo unificado en usuarios)
-- - Campo qr_token agregado a usuarios
-- - Asistencia_general ahora soporta tipo 'general'
-- - Campos duplicados eliminados (precio/costo, fecha_realizacion/fecha)
-- - Campo participante_id eliminado de inscripciones_competencias
-- - Contadores automáticos de inscritos (triggers)
-- - Vistas útiles para reportes
-- - Campos de estado agregados (pendiente/confirmada/cancelada)
-- - Campo activo para soft-delete de actividades
-- - Timestamps de actualización
-- - Códigos de verificación para diplomas
-- - Índices optimizados para consultas frecuentes
-- - Integridad referencial completa
-- ====================================================
