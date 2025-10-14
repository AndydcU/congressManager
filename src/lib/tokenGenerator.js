import crypto from 'crypto';

/**
 * Genera un token único para una inscripción
 * @returns {string} Token único de 32 caracteres hexadecimales
 */
export function generateUniqueToken() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Genera un token con prefijo para identificar el tipo
 * @param {string} type - 'taller' o 'competencia'
 * @param {number} id - ID de la actividad
 * @returns {string} Token único con prefijo
 */
export function generateTokenWithPrefix(type, id) {
  const prefix = type === 'taller' ? 'TLR' : 'CMP';
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(8).toString('hex');
  return `${prefix}-${id}-${timestamp}-${random}`;
}
