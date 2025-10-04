import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/utils";
import { ErrorFactory } from "../errors/errorFactory";
import { secureLogger } from "../utils/logger";
import jwt from "jsonwebtoken";

/**
 * Middleware para autenticar requests con JWT
 * Valida formato Bearer token y verifica la firma
 */
export function authenticateRequest(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { authorization } = req.headers;

  // Validar presencia del header
  if (!authorization) {
    secureLogger.warn("Authentication attempt without authorization header", {
      ip: req.ip,
      path: req.path,
    });

    return next(
      ErrorFactory.unauthorized(
        "No autorizado: falta encabezado de autorización"
      )
    );
  }

  // Validar formato "Bearer <token>"
  const parts = authorization.split(" ");

  if (parts.length !== 2) {
    secureLogger.warn("Invalid authorization header format", {
      ip: req.ip,
      format: "parts count",
    });

    return next(
      ErrorFactory.unauthorized(
        "Formato de autorización inválido. Use: Bearer <token>"
      )
    );
  }

  const [scheme, token] = parts;

  if (scheme !== "Bearer") {
    secureLogger.warn("Invalid authorization scheme", {
      ip: req.ip,
      scheme,
    });

    return next(
      ErrorFactory.unauthorized(
        "Esquema de autorización inválido. Use: Bearer <token>"
      )
    );
  }

  // Validar que el token no esté vacío
  if (!token || token.trim().length === 0) {
    secureLogger.warn("Empty token provided", {
      ip: req.ip,
    });

    return next(ErrorFactory.unauthorized("Token vacío"));
  }

  try {
    // Verificar el token
    const user = verifyAccessToken(token);

    // Validar estructura del payload
    if (!user || typeof user !== "object") {
      secureLogger.warn("Invalid token payload structure", {
        ip: req.ip,
      });

      return next(ErrorFactory.unauthorized("Payload de token inválido"));
    }

    // Validar que tenga los campos requeridos
    if (!("email" in user) || !("rol" in user)) {
      secureLogger.warn("Token payload missing required fields", {
        ip: req.ip,
      });

      return next(ErrorFactory.unauthorized("Token con estructura inválida"));
    }

    // Agregar usuario al request
    req.user = user;

    secureLogger.debug("User authenticated successfully", {
      email: user.email,
      rol: user.rol,
    });

    next();
  } catch (error) {
    // Manejo específico de errores de JWT
    if (error instanceof jwt.TokenExpiredError) {
      secureLogger.info("Expired token attempt", {
        ip: req.ip,
        expiredAt: error.expiredAt,
      });

      return next(ErrorFactory.unauthorized("Token expirado"));
    }

    if (error instanceof jwt.JsonWebTokenError) {
      secureLogger.warn("Malformed token attempt", {
        ip: req.ip,
        error: error.message,
      });

      return next(ErrorFactory.unauthorized("Token malformado"));
    }

    if (error instanceof jwt.NotBeforeError) {
      secureLogger.warn("Token used before valid", {
        ip: req.ip,
      });

      return next(ErrorFactory.unauthorized("Token aún no válido"));
    }

    // Error desconocido
    secureLogger.error("Unknown authentication error", error, {
      ip: req.ip,
    });

    return next(ErrorFactory.unauthorized("Token inválido"));
  }
}

/**
 * Middleware para verificar rol de usuario
 * Debe usarse después de authenticateRequest
 */
export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || typeof req.user !== "object" || !("rol" in req.user)) {
      return next(ErrorFactory.unauthorized("Usuario no autenticado"));
    }

    const userRole = (req.user as any).rol;

    if (!allowedRoles.includes(userRole)) {
      secureLogger.warn("Unauthorized role access attempt", {
        userRole,
        requiredRoles: allowedRoles,
        path: req.path,
      });

      return next(
        ErrorFactory.forbidden("No tiene permisos para acceder a este recurso")
      );
    }

    next();
  };
}
