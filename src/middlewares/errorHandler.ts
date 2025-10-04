import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/errors";
import { secureLogger } from "../utils/logger";
import config from "../config/config";

/**
 * Middleware global para manejo de errores
 * Registra errores de forma segura y devuelve respuestas apropiadas
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Determinar si es un error conocido de la aplicación
  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.status : 500;
  
  // Determinar el mensaje de error
  let message: string;
  
  if (isAppError) {
    message = err.message;
  } else if (err instanceof Error) {
    // En producción, no exponer mensajes de error internos
    message = config.NODE_ENV === 'production' 
      ? 'Error interno del servidor'
      : err.message;
  } else {
    message = 'Error interno del servidor';
  }

  // Logging según el tipo y severidad del error
  if (!isAppError || statusCode === 500) {
    // Errores 500 o desconocidos: log completo
    secureLogger.error('Unhandled error occurred', err, {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId: (req.user as any)?.email,
    });
  } else if (statusCode >= 400 && statusCode < 500) {
    // Errores 4xx: log de información
    secureLogger.info(`Client error: ${statusCode} - ${message}`, {
      method: req.method,
      url: req.url,
      ip: req.ip,
      statusCode,
    });
  }

  // Preparar respuesta de error
  const errorResponse: any = {
    error: message,
    statusCode,
  };

  // En desarrollo, incluir información adicional
  if (config.NODE_ENV !== 'production') {
    if (err instanceof Error) {
      errorResponse.stack = err.stack;
      errorResponse.name = err.name;
    }
    
    errorResponse.timestamp = new Date().toISOString();
    errorResponse.path = req.path;
  }

  // Enviar respuesta
  res.status(statusCode).json(errorResponse);
}

/**
 * Middleware para manejar rutas no encontradas (404)
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  secureLogger.warn('Route not found', {
    method: req.method,
    url: req.url,
    ip: req.ip,
  });

  res.status(404).json({
    error: 'Ruta no encontrada',
    statusCode: 404,
    path: req.path,
  });
}

/**
 * Middleware para capturar errores asíncronos
 * Útil para envolver route handlers
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
