import winston from 'winston';
import config from '../config/config';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Formato personalizado para los logs
const logFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  
  // Agregar metadata si existe
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  
  // Agregar stack trace si es un error
  if (stack) {
    msg += `\n${stack}`;
  }
  
  return msg;
});

// Configuración del logger
export const logger = winston.createLogger({
  level: config.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  defaultMeta: { service: 'comoencasa-api' },
  transports: [
    // Logs de error en archivo separado
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Todos los logs en otro archivo
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
  // Evitar que el proceso se detenga por errores del logger
  exitOnError: false,
});

// En desarrollo, también mostrar logs en consola con colores
if (config.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
      ),
    })
  );
}

/**
 * Logger seguro que evita exponer información sensible
 */
export const secureLogger = {
  /**
   * Log de información general
   */
  info: (message: string, meta?: Record<string, any>) => {
    logger.info(message, sanitizeMetadata(meta));
  },

  /**
   * Log de advertencias
   */
  warn: (message: string, meta?: Record<string, any>) => {
    logger.warn(message, sanitizeMetadata(meta));
  },

  /**
   * Log de errores sin exponer información sensible
   */
  error: (message: string, error?: unknown, meta?: Record<string, any>) => {
    const sanitizedMeta = sanitizeMetadata(meta);
    
    if (error instanceof Error) {
      logger.error(message, {
        error: error.message,
        stack: config.NODE_ENV !== 'production' ? error.stack : undefined,
        ...sanitizedMeta,
      });
    } else {
      logger.error(message, {
        error: 'Unknown error',
        ...sanitizedMeta,
      });
    }
  },

  /**
   * Log de debug (solo en desarrollo)
   */
  debug: (message: string, meta?: Record<string, any>) => {
    if (config.NODE_ENV !== 'production') {
      logger.debug(message, sanitizeMetadata(meta));
    }
  },
};

/**
 * Sanitiza metadata para evitar exponer información sensible
 */
function sanitizeMetadata(meta?: Record<string, any>): Record<string, any> {
  if (!meta) return {};

  const sanitized = { ...meta };
  const sensitiveKeys = [
    'password',
    'token',
    'accessToken',
    'refreshToken',
    'secret',
    'apiKey',
    'authorization',
    'cookie',
  ];

  for (const key of Object.keys(sanitized)) {
    const lowerKey = key.toLowerCase();
    
    // Si la clave contiene información sensible, enmascararla
    if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
      sanitized[key] = '***REDACTED***';
    }
  }

  return sanitized;
}

export default logger;
