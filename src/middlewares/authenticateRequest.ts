import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/utils";
import { UnauthorizedError } from "../errors/errors";
import { ErrorFactory } from "../errors/errorFactory";

export function authenticateRequest(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { authorization } = req.headers;

  if (!authorization) {
    throw ErrorFactory.unauthorized(
      "No autorizado, token inexistente o invalido"
    );
  }

  try {
    const token = authorization.split(" ")[1];
    const user = verifyAccessToken(token);
    req.user = user;
    next();
  } catch (error) {
    return next(new UnauthorizedError("Token inválido o expirado"));
  }
}
