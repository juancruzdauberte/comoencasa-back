import { Router } from "express";
import passport from "passport";
import {
  failure,
  googleCallback,
  logOut,
  refreshToken,
  getCurrentUser,
} from "../controllers/auth.controller";
import { authenticateRequest } from "../middlewares/authenticateRequest";

const router = Router();

/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: Iniciar sesión con Google
 *     tags: [Authentication]
 *     description: |
 *       Inicia el flujo de autenticación con Google OAuth 2.0.
 *       Redirige al usuario a la página de login de Google.
 *     responses:
 *       302:
 *         description: Redirección a Google para autenticación
 */
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

/**
 * @swagger
 * /api/auth/callback:
 *   get:
 *     summary: Callback de Google OAuth
 *     tags: [Authentication]
 *     description: |
 *       Endpoint de callback para procesar la respuesta de autenticación de Google.
 *       - Genera un JWT token
 *       - Genera un refresh token
 *       - Almacena el refresh token en una cookie httpOnly
 *       - Redirige al frontend con el JWT
 *     responses:
 *       302:
 *         description: Redirección exitosa con tokens generados
 *       401:
 *         description: Fallo en la autenticación
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/callback",
  passport.authenticate("google", {
    failureRedirect: `/api/auth/failure`,
    failureMessage: true,
    session: false,
  }),
  googleCallback
);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Obtener usuario actual
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     description: Retorna la información del usuario autenticado actualmente
 *     responses:
 *       200:
 *         description: Información del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 email:
 *                   type: string
 *                   example: usuario@gmail.com
 *                 name:
 *                   type: string
 *                   example: Juan Pérez
 *                 avatar:
 *                   type: string
 *                   example: https://lh3.googleusercontent.com/...
 *                 role:
 *                   type: string
 *                   enum: [admin, user]
 *       401:
 *         $ref: '#/components/schemas/Error'
 */
router.get("/me", authenticateRequest, getCurrentUser);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Renovar access token
 *     tags: [Authentication]
 *     description: |
 *       Genera un nuevo JWT usando el refresh token almacenado en cookies.
 *       
 *       **Rate Limiting:** 5 intentos cada 15 minutos
 *     responses:
 *       200:
 *         description: Nuevo access token generado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   description: Nuevo JWT token
 *       401:
 *         description: Refresh token inválido o expirado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Demasiados intentos de refresh
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/refresh", refreshToken);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Cerrar sesión
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     description: |
 *       Cierra la sesión del usuario:
 *       - Invalida el JWT actual
 *       - Elimina el refresh token
 *       - Limpia la cookie de refresh token
 *     responses:
 *       200:
 *         description: Sesión cerrada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Sesión cerrada exitosamente
 *       401:
 *         $ref: '#/components/schemas/Error'
 */
router.post("/logout", authenticateRequest, logOut);

/**
 * @swagger
 * /api/auth/failure:
 *   get:
 *     summary: Fallo de autenticación
 *     tags: [Authentication]
 *     description: Endpoint que maneja los fallos en el proceso de autenticación
 *     responses:
 *       401:
 *         description: Error de autenticación
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/failure", failure);

export default router;