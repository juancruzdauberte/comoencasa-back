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
 * /api/auth/callback:
 *   get:
 *     summary: Callback de Google OAuth
 *     description: |
 *       Endpoint de callback para autenticación con Google OAuth 2.0.
 *       Redirige al usuario después de autenticarse con Google.
 *       
 *       **Flujo de autenticación:**
 *       1. Usuario hace clic en "Login con Google"
 *       2. Se redirige a Google para autenticación
 *       3. Google redirige a este endpoint
 *       4. Se genera JWT y refresh token
 *       5. Redirige a /auth-success con el access token en la URL
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirección exitosa a la aplicación frontend
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get(
  "/callback",
  passport.authenticate("google", {
    scope: ["profile", "email"],
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
 *     description: Retorna la información del usuario autenticado actualmente
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Información del usuario actual
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 email:
 *                   type: string
 *                   description: Email del usuario
 *                   example: usuario@ejemplo.com
 *                 rol:
 *                   type: string
 *                   enum: [admin, user]
 *                   description: Rol del usuario
 *                   example: admin
 *                 avatar:
 *                   type: string
 *                   description: URL del avatar del usuario
 *                   example: https://lh3.googleusercontent.com/...
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get("/me", authenticateRequest, getCurrentUser);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Cerrar sesión
 *     description: |
 *       Cierra la sesión del usuario eliminando el refresh token de las cookies.
 *       El access token dejará de ser válido inmediatamente.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
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
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post("/logout", authenticateRequest, logOut);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refrescar access token
 *     description: |
 *       Genera un nuevo access token usando el refresh token almacenado en cookies.
 *       
 *       **Importante:**
 *       - El access token expira en 5 minutos
 *       - El refresh token expira en 7 días
 *       - El refresh token se almacena en una cookie httpOnly
 *       - Máximo 5 intentos cada 15 minutos (rate limited)
 *     tags: [Authentication]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Access token renovado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   description: Nuevo JWT access token
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       401:
 *         description: Refresh token inválido o expirado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: Refresh token no encontrado
 *               statusCode: 401
 *       429:
 *         description: Demasiados intentos de renovación
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Demasiados intentos de renovación de token. Intente en 15 minutos.
 */
router.post("/refresh", refreshToken);

/**
 * @swagger
 * /api/auth/failure:
 *   get:
 *     summary: Manejo de fallos de autenticación
 *     description: Endpoint que maneja fallos en el proceso de autenticación con Google
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirección a la página de error en el frontend
 */
router.get("/failure", failure);

export default router;
