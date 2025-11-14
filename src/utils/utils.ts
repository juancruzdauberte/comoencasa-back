import jwt from "jsonwebtoken";
import config from "../config/config";
import { TokenPayloadDTO } from "../dtos/auth.dto";

export function generateAccessToken(payload: TokenPayloadDTO) {
  return jwt.sign(payload, config.JWT_SECRET_ACCESS_TOKEN!, {
    expiresIn: "15m",
    audience: "access",
  });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, config.JWT_SECRET_ACCESS_TOKEN!);
}

export function generateRefreshToken(payload: TokenPayloadDTO) {
  return jwt.sign(payload, config.JWT_SECRET_REFRESH_TOKEN!, {
    expiresIn: "3d",
    audience: "refresh",
  });
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, config.JWT_SECRET_REFRESH_TOKEN!);
}

export function dateUTC3(date: Date) {
  return new Date(date.getTime() - 3 * 60 * 60 * 1000);
}
