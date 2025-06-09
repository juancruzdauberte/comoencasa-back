import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/utils";
import { UnauthorizedError } from "../errors/errors";
import { Payload } from "../types/types";

export function authenticateRequest(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { token } = req.cookies;

  if (!token) {
    return next(new UnauthorizedError("Token invalido o no proporcionado"));
  }

  try {
    const payload = verifyAccessToken(token) as Payload;
    req.user = payload;
    return next();
  } catch (error) {
    return next(new UnauthorizedError("Token inválido o expirado"));
  }
}
