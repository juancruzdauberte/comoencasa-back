import { Router } from "express";
import { getClient } from "../controllers/clients.controller";

const router = Router();

/**
 * @swagger
 * /api/clients/{tel}:
 *   get:
 *     summary: Obtener cliente por teléfono
 *     description: Retorna los detalles de un cliente buscado por su número de teléfono
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tel
 *         required: true
 *         schema:
 *           type: string
 *         description: Número de teléfono del cliente (formato internacional)
 *         example: +5491123456789
 *     responses:
 *       200:
 *         description: Información del cliente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Client'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get("/:tel", getClient);

export default router;
