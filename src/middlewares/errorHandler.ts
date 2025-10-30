import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/errors";
import { secureLogger } from "../config/logger";
import config from "../config/config";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.status : 500;

  let message: string;

  if (isAppError) {
    message = err.message;
  } else if (err instanceof Error) {
    message =
      config.NODE_ENV === "production"
        ? "Error interno del servidor"
        : err.message;
  } else {
    message = "Error interno del servidor";
  }

  if (!isAppError || statusCode === 500) {
    secureLogger.error("Unhandled error occurred", err, {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get("user-agent"),
      userId: (req.user as any)?.email,
    });
  } else if (statusCode >= 400 && statusCode < 500) {
    secureLogger.info(`Client error: ${statusCode} - ${message}`, {
      method: req.method,
      url: req.url,
      ip: req.ip,
      statusCode,
    });
  }

  const errorResponse: any = {
    error: message,
    statusCode,
  };

  if (config.NODE_ENV !== "production") {
    if (err instanceof Error) {
      errorResponse.stack = err.stack;
      errorResponse.name = err.name;
    }

    errorResponse.timestamp = new Date().toISOString();
    errorResponse.path = req.path;
  }

  res.status(statusCode).json(errorResponse);
}

export function notFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  secureLogger.warn("Route not found", {
    method: req.method,
    url: req.url,
    ip: req.ip,
  });

  res.status(404).json({
    error: "Ruta no encontrada",
    statusCode: 404,
    path: req.path,
  });
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
