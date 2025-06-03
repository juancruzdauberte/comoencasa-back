import { Request, Response, NextFunction } from "express";
import { getErrorMessage } from "../utils/utils";
import { CustomError } from "../types/types";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const error = err as CustomError;
  console.error("Error capturado del middleware", error);
  res.status(error.statusCode || 500).json({
    error: true,
    message: getErrorMessage(error) || "Ha ocurrido un error inesperado.",
  });
}
