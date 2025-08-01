import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/errors";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const isAppError = err instanceof AppError;
  const status = isAppError ? err.status : 500;
  const message = isAppError ? err.message : "Error interno del servidor";

  if (!isAppError || status === 500) {
    console.log("Error interno", err);
  }

  res.status(status).json({ error: message });
}
