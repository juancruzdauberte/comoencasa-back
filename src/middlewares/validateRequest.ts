import { NextFunction, Request, Response } from "express";
import { BadRequestError } from "../errors/errors";
import { validationResult, ValidationError } from "express-validator";

export function validateRequest(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const messages = errors.array().map((err: ValidationError) => err.msg);
    return next(new BadRequestError(messages.join(", ")));
  }

  next();
}
