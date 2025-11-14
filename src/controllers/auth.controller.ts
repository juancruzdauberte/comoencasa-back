import { Request, Response, NextFunction } from "express";
import config from "../config/config";
import { UserDTO, TokenPayloadDTO } from "../dtos/auth.dto";
import { ErrorFactory } from "../errors/errorFactory";
import { generateAccessToken, verifyRefreshToken } from "../utils/utils";
import { secureLogger } from "../config/logger";

export function googleCallback(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { user, accessToken, refreshToken } = req.user as {
      user: UserDTO;
      accessToken: string;
      refreshToken: string;
    };

    if (!user || !accessToken || !refreshToken) {
      secureLogger.error(
        "Incomplete authentication data from Google OAuth",
        undefined,
        {
          hasUser: !!user,
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
        }
      );
      throw ErrorFactory.internal("Error en la autenticación de Google");
    }

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: config.NODE_ENV === "production" ? true : false,
      sameSite: config.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 3 * 24 * 60 * 60 * 1000,
    });

    secureLogger.info("User authenticated successfully via Google OAuth", {
      email: user.email,
      rol: user.rol,
    });

    res.redirect(`${config.CLIENT_URL}/auth-success?token=${accessToken}`);
  } catch (error) {
    secureLogger.error("Error in Google OAuth callback", error);
    next(error);
  }
}

export async function refreshToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    secureLogger.warn("Refresh token attempt without token", {
      ip: req.ip,
    });
    return next(ErrorFactory.unauthorized("Refresh token no encontrado"));
  }

  try {
    const user = verifyRefreshToken(refreshToken) as TokenPayloadDTO;

    if (!user || !user.email || !user.rol) {
      secureLogger.warn("Invalid refresh token payload", {
        ip: req.ip,
      });
      return next(ErrorFactory.unauthorized("Token inválido"));
    }

    const accessToken = generateAccessToken({
      rol: user.rol,
      email: user.email,
    });

    secureLogger.info("Access token refreshed successfully", {
      email: user.email,
    });

    res.json({ accessToken });
  } catch (error) {
    secureLogger.warn("Failed to refresh access token", {
      ip: req.ip,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    next(error);
  }
}

export async function logOut(req: Request, res: Response, next: NextFunction) {
  try {
    const userEmail = (req.user as any)?.email;

    res.clearCookie("refreshToken");

    secureLogger.info("User logged out successfully", {
      email: userEmail,
    });

    res.status(200).json({
      message: "Sesión cerrada exitosamente",
    });
  } catch (error) {
    secureLogger.error("Error during logout", error, {
      email: (req.user as any)?.email,
    });
    next(error);
  }
}

export async function failure(req: Request, res: Response, next: NextFunction) {
  try {
    secureLogger.warn("Google OAuth authentication failed", {
      ip: req.ip,
    });

    res.redirect(`${config.CLIENT_URL}/failure`);
  } catch (error) {
    secureLogger.error("Error handling authentication failure", error);
    next(error);
  }
}

export async function getCurrentUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const user = req.user as TokenPayloadDTO;

    if (!user) {
      return next(ErrorFactory.unauthorized("Usuario no autenticado"));
    }

    res.json({
      email: user.email,
      rol: user.rol,
    });
  } catch (error) {
    secureLogger.error("Error getting current user", error);
    next(error);
  }
}
