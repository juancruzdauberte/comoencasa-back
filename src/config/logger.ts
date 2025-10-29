import winston from 'winston';
import config from './config';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Formato personalizado para los logs
const logFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  
  // Agregar metadata si existe (pero limitada)
  if (Object.keys(metadata).length > 0) {
    const truncatedMeta = JSON.stringify(metadata).substring(0, 500); // ✅ Limitar tamaño
    msg += ` ${truncatedMeta}`;
  }
  
  // Agregar stack trace si es un error
  if (stack) {
    msg += `\n${stack}`;
  }
  
  return msg;
});

// ✅ SOLUCIÓN: Configuración optimizada del logger
export const logger = winston.createLogger({
  level: config.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  defaultMeta: { service: 'comoencasa-api' },
  transports: [
    // ✅ Logs de error con rotación agresiva
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 2097152,  // 2MB (reducido de 5MB)
      maxFiles: 3,       // Solo 3 archivos (reducido de 5)
      tailable: true,    // ✅ Mantener los logs más recientes
      zippedArchive: true, // ✅ Comprimir logs antiguos
    }),
    // ✅ Logs combinados con rotación agresiva
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 3145728,  // 3MB (reducido de 5MB)
      maxFiles: 2,       // Solo 2 archivos (reducido de 5)
      tailable: true,
      zippedArchive: true,
    }),
  ],
  exitOnError: false,
});

// ✅ Logs en consola optimizados
if (config.NODE_ENV === 'production') {
  logger.add(
    new winston.transports.Console({
      format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
      ),
      level: 'warn', // ✅ Solo warnings y errores en producción
    })
  );
} else {
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
 * Logger seguro con prevención de memory leaks
 */
export const secureLogger = {
  info: (message: string, meta?: Record<string, any>) => {
    // ✅ Limitar frecuencia de logs
    if (config.NODE_ENV === 'production' && shouldThrottle('info')) {
      return;
    }
    logger.info(message, sanitizeMetadata(meta));
  },

  warn: (message: string, meta?: Record<string, any>) => {
    logger.warn(message, sanitizeMetadata(meta));
  },

  error: (message: string, error?: unknown, meta?: Record<string, any>) => {
    const sanitizedMeta = sanitizeMetadata(meta);
    
    if (error instanceof Error) {
      logger.error(message, {
        error: error.message,
        // ✅ Stack trace solo en desarrollo
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

  debug: (message: string, meta?: Record<string, any>) => {
    if (config.NODE_ENV !== 'production') {
      logger.debug(message, sanitizeMetadata(meta));
    }
  },
};

/**
 * ✅ NUEVO: Throttling para evitar spam de logs
 */
const logThrottleMap = new Map<string, number>();
const THROTTLE_INTERVAL = 1000; // 1 segundo

function shouldThrottle(level: string): boolean {
  const now = Date.now();
  const lastLog = logThrottleMap.get(level) || 0;
  
  if (now - lastLog < THROTTLE_INTERVAL) {
    return true; // Throttle
  }
  
  logThrottleMap.set(level, now);
  return false;
}

/**
 * ✅ MEJORADO: Sanitización más agresiva
 */
function sanitizeMetadata(meta?: Record<string, any>): Record<string, any> {
  if (!meta) return {};

  const sanitized = { ...meta };
  const sensitiveKeys = [
    'password', 'token', 'accessToken', 'refreshToken', 'secret',
    'apiKey', 'authorization', 'cookie', 'session', 'jwt',
  ];

  for (const key of Object.keys(sanitized)) {
    const lowerKey = key.toLowerCase();
    
    // Redactar información sensible
    if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
      sanitized[key] = '***REDACTED***';
    }
    
    // ✅ Limitar tamaño de strings grandes
    if (typeof sanitized[key] === 'string' && sanitized[key].length > 200) {
      sanitized[key] = sanitized[key].substring(0, 200) + '...';
    }
    
    // ✅ Limitar arrays grandes
    if (Array.isArray(sanitized[key]) && sanitized[key].length > 10) {
      sanitized[key] = sanitized[key].slice(0, 10);
    }
  }

  return sanitized;
}

// ✅ Limpiar el mapa de throttling cada 5 minutos
setInterval(() => {
  logThrottleMap.clear();
}, 300000);

export default logger;
