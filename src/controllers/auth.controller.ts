import { Request, Response, NextFunction } from "express";
import config from "../config/config";
import { Payload, User } from "../types/types";
import { ErrorFactory } from "../errors/errorFactory";
import { generateAccessToken, verifyRefreshToken } from "../utils/utils";

export function googleCallback(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { user, accessToken, refreshToken } = req.user as {
      user: User;
      accessToken: string;
      refreshToken: string;
    };

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      maxAge: 3 * 24 * 60 * 60 * 1000,
      sameSite: "lax",
    });

    res.redirect(`${config.CLIENT_URL}/auth-success?token=${accessToken}`);
  } catch (error) {
    next(error);
  }
}

export async function refreshToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { refreshToken } = req.cookies;
  if (!refreshToken)
    throw ErrorFactory.unauthorized("Refresh token no encontrado");
  try {
    const user = verifyRefreshToken(refreshToken) as Payload;
    const accessToken = generateAccessToken({
      rol: user.rol,
      email: user.email,
      avatar: user.avatar,
    });
    res.json({ accessToken });
  } catch (error) {
    next(error);
  }
}

export async function logOut(req: Request, res: Response, next: NextFunction) {
  try {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
    });
  } catch (error) {
    next(error);
  }
}

export async function failure(req: Request, res: Response, next: NextFunction) {
  try {
    res.redirect(`${config.CLIENT_URL}/failure`);
  } catch (error) {
    next(error);
  }
}
