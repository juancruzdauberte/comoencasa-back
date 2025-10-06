import { Router } from "express";
import {
  getAmountMonthly,
  getAmountToday,
  getCashAmountMonthly,
  getCashAmountToday,
  getDeliveryAmountToPay,
  getValueFinanceParam,
  getTransferAmountToday,
  getTrasnferAmountMonthly,
  updateValueFinanceParam,
  getDeliveryCashAmount,
} from "../controllers/finances.controller";

const router = Router();

/**
 * @swagger
 * /api/finances/today:
 *   get:
 *     summary: Obtener monto total de hoy
 *     description: Retorna el monto total de ventas del día actual
 *     tags: [Finances]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Monto total de ventas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FinanceAmount'
 */
router.get("/today", getAmountToday);

/**
 * @swagger
 * /api/finances/today/transfer:
 *   get:
 *     summary: Obtener monto de transferencias de hoy
 *     description: Retorna el monto total de ventas por transferencia del día actual
 *     tags: [Finances]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Monto total de transferencias
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FinanceAmount'
 */
router.get("/today/transfer", getTransferAmountToday);

/**
 * @swagger
 * /api/finances/today/cash:
 *   get:
 *     summary: Obtener monto en efectivo de hoy
 *     description: Retorna el monto total de ventas en efectivo del día actual
 *     tags: [Finances]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Monto total en efectivo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FinanceAmount'
 */
router.get("/today/cash", getCashAmountToday);

/**
 * @swagger
 * /api/finances/today/delivery/pay:
 *   get:
 *     summary: Obtener monto a pagar al delivery
 *     description: Retorna el monto total a pagar al servicio de delivery
 *     tags: [Finances]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Monto a pagar al delivery
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FinanceAmount'
 */
router.get("/today/delivery/pay", getDeliveryAmountToPay);

/**
 * @swagger
 * /api/finances/today/delivery/cash:
 *   get:
 *     summary: Obtener efectivo recolectado por delivery
 *     description: Retorna el monto total en efectivo recolectado por el servicio de delivery
 *     tags: [Finances]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Monto en efectivo del delivery
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FinanceAmount'
 */
router.get("/today/delivery/cash", getDeliveryCashAmount);

/**
 * @swagger
 * /api/finances/param:
 *   get:
 *     summary: Obtener parámetros financieros
 *     description: Retorna los parámetros configurables del sistema financiero
 *     tags: [Finances]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Parámetros financieros
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 delivery_fee:
 *                   type: number
 *                   description: Tarifa de delivery
 *                 min_order_amount:
 *                   type: number
 *                   description: Monto mínimo de pedido
 */
router.get("/param", getValueFinanceParam);

/**
 * @swagger
 * /api/finances/param:
 *   put:
 *     summary: Actualizar parámetros financieros
 *     description: Actualiza los parámetros configurables del sistema financiero
 *     tags: [Finances]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [delivery_fee, min_order_amount]
 *             properties:
 *               delivery_fee:
 *                 type: number
 *                 description: Nueva tarifa de delivery
 *               min_order_amount:
 *                 type: number
 *                 description: Nuevo monto mínimo de pedido
 *     responses:
 *       200:
 *         description: Parámetros actualizados exitosamente
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 */
router.put("/param", updateValueFinanceParam);

/**
 * @swagger
 * /api/finances/monthly:
 *   get:
 *     summary: Obtener monto total mensual
 *     description: Retorna el monto total de ventas del mes actual
 *     tags: [Finances]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Monto total mensual
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FinanceAmount'
 */
router.get("/monthly", getAmountMonthly);

/**
 * @swagger
 * /api/finances/monthly/cash:
 *   get:
 *     summary: Obtener monto en efectivo mensual
 *     description: Retorna el monto total de ventas en efectivo del mes actual
 *     tags: [Finances]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Monto mensual en efectivo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FinanceAmount'
 */
router.get("/monthly/cash", getCashAmountMonthly);

/**
 * @swagger
 * /api/finances/monthly/transfer:
 *   get:
 *     summary: Obtener monto de transferencias mensual
 *     description: Retorna el monto total de ventas por transferencia del mes actual
 *     tags: [Finances]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Monto mensual por transferencias
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FinanceAmount'
 */
router.get("/monthly/transfer", getTrasnferAmountMonthly);

export default router;
