import jwt from "jsonwebtoken";
import config from "../config/config";
import { Payload } from "../types/types";

export function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

export function generateAccessToken(payload: Payload) {
  return jwt.sign(payload, config.JWT_SECRET_ACCESS_TOKEN!, {
    expiresIn: "3d",
  });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, config.JWT_SECRET_ACCESS_TOKEN!);
}
