import { Request, Response, NextFunction } from "express";
import config from "../config/config";
import { Payload, User } from "../types/types";
import { ErrorFactory } from "../errors/errorFactory";
import { generateAccessToken, verifyRefreshToken } from "../utils/utils";
import { secureLogger } from "../config/logger";

/**
 * Configuración segura de cookies
 */
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: config.NODE_ENV === "production" ? false : true, // Solo HTTPS en producción
  sameSite: "none" as const, // Prevenir CSRF
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
};

/**
 * Callback de autenticación de Google OAuth
 * Establece refresh token en cookie httpOnly
 */
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

    // Establecer refresh token en cookie httpOnly
    res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);

    secureLogger.info("User authenticated successfully via Google OAuth", {
      email: user.email,
      rol: user.rol,
    });

    // Redirigir con access token en URL (temporal)
    // NOTA: En producción, considerar usar solo cookies para ambos tokens
    res.redirect(`${config.CLIENT_URL}/auth-success?token=${accessToken}`);
  } catch (error) {
    secureLogger.error("Error in Google OAuth callback", error);
    next(error);
  }
}

/**
 * Endpoint para refrescar el access token usando refresh token
 * Protegido con rate limiting
 */
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
    // Verificar refresh token
    const user = verifyRefreshToken(refreshToken) as Payload;

    // Validar estructura del payload
    if (!user || !user.email || !user.rol) {
      secureLogger.warn("Invalid refresh token payload", {
        ip: req.ip,
      });
      return next(ErrorFactory.unauthorized("Token inválido"));
    }

    // Generar nuevo access token
    const accessToken = generateAccessToken({
      rol: user.rol,
      email: user.email,
      avatar: user.avatar,
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

/**
 * Endpoint para cerrar sesión
 * Limpia el refresh token de las cookies
 */
export async function logOut(req: Request, res: Response, next: NextFunction) {
  try {
    const userEmail = (req.user as any)?.email;

    // Limpiar cookie de refresh token
    res.clearCookie("refreshToken", COOKIE_OPTIONS);

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

/**
 * Maneja fallos de autenticación de Google
 */
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

/**
 * Endpoint para obtener información del usuario actual
 * Requiere autenticación
 */
export async function getCurrentUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const user = req.user as Payload;

    if (!user) {
      return next(ErrorFactory.unauthorized("Usuario no autenticado"));
    }

    // Retornar solo información pública del usuario
    res.json({
      email: user.email,
      rol: user.rol,
      avatar: user.avatar,
    });
  } catch (error) {
    secureLogger.error("Error getting current user", error);
    next(error);
  }
}
