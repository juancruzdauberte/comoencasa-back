import { NextFunction, Request, Response } from "express";
import { ErrorFactory } from "../errors/errorFactory";
import { secureLogger } from "../config/logger";
import { verifyRefreshToken } from "../utils/utils";
import { Payload } from "../types/types";

export default function protectedDocs(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      secureLogger.warn("Refresh token attempt without token", {
        ip: req.ip,
      });
      return next(ErrorFactory.unauthorized("Refresh token no encontrado"));
    }

    const user = verifyRefreshToken(refreshToken) as Payload;

    if (!user || !user.email || !user.rol) {
      secureLogger.warn("Invalid refresh token payload", {
        ip: req.ip,
      });
      return next(ErrorFactory.unauthorized("Token inválido"));
    }

    next();
  } catch (error) {
    secureLogger.warn("Failed to refresh access token", {
      ip: req.ip,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    next(error);
  }
}
