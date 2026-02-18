import { Router } from "express";
import { addProductSchema } from "../middlewares/order/addProductToOrderSchema";
import { validateRequest } from "../middlewares/validateRequest";
import { OrderController } from "../controllers/orders.controller";

export const orderRouter = (controller: OrderController) => {
  const router = Router();

  /**
   * @swagger
   * /api/orders:
   *   get:
   *     summary: Obtener todos los pedidos
   *     description: Retorna la lista de todos los pedidos registrados
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Lista de pedidos
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Order'
   *       401:
   *         $ref: '#/components/responses/UnauthorizedError'
   */
  router.get("/", controller.getOrders);

  /**
   * @swagger
   * /api/orders/{oid}:
   *   get:
   *     summary: Obtener un pedido por ID
   *     description: Retorna los detalles de un pedido específico
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: oid
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID del pedido
   *     responses:
   *       200:
   *         description: Detalles del pedido
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Order'
   *       404:
   *         $ref: '#/components/responses/NotFoundError'
   */
  router.get("/:oid", controller.getOrderById);

  /**
   * @swagger
   * /api/orders:
   *   post:
   *     summary: Crear un nuevo pedido
   *     description: Crea un nuevo pedido con los detalles proporcionados
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateOrderRequest'
   *     responses:
   *       201:
   *         description: Pedido creado exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Order'
   *       400:
   *         $ref: '#/components/responses/BadRequestError'
   */
  router.post("/", controller.createOrder);

  /**
   * @swagger
   * /api/orders/product:
   *   post:
   *     summary: Agregar producto a un pedido
   *     description: Agrega un nuevo producto a un pedido existente
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [order_id, producto_id, cantidad]
   *             properties:
   *               order_id:
   *                 type: integer
   *                 description: ID del pedido
   *               producto_id:
   *                 type: integer
   *                 description: ID del producto a agregar
   *               cantidad:
   *                 type: integer
   *                 minimum: 1
   *                 description: Cantidad del producto
   *     responses:
   *       200:
   *         description: Producto agregado exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Order'
   *       400:
   *         $ref: '#/components/responses/BadRequestError'
   */
  router.post(
    "/product",
    addProductSchema,
    validateRequest,
    controller.addProductToOrder,
  );

  /**
   * @swagger
   * /api/orders/pay/{oid}:
   *   post:
   *     summary: Registrar pago de pedido
   *     description: Actualiza la fecha de pago de un pedido
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: oid
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID del pedido
   *     responses:
   *       200:
   *         description: Pago registrado exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Order'
   *       404:
   *         $ref: '#/components/responses/NotFoundError'
   */
  router.post("/pay/:oid", controller.insertOrderDatePay);

  /**
   * @swagger
   * /api/orders/{oid}/product/{pid}:
   *   delete:
   *     summary: Eliminar producto de un pedido
   *     description: Elimina un producto específico de un pedido
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: oid
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID del pedido
   *       - in: path
   *         name: pid
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID del producto
   *     responses:
   *       200:
   *         description: Producto eliminado exitosamente
   *       404:
   *         $ref: '#/components/responses/NotFoundError'
   */
  router.delete("/:oid/product/:pid", controller.deleteProductFromOrder);

  /**
   * @swagger
   * /api/orders/{oid}:
   *   delete:
   *     summary: Eliminar un pedido
   *     description: Elimina un pedido completo
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: oid
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID del pedido
   *     responses:
   *       200:
   *         description: Pedido eliminado exitosamente
   *       404:
   *         $ref: '#/components/responses/NotFoundError'
   */
  router.delete("/:oid", controller.deleteOrder);

  /**
   * @swagger
   * /api/orders/{oid}/product/{pid}:
   *   patch:
   *     summary: Actualizar cantidad de producto
   *     description: Actualiza la cantidad de un producto en un pedido
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: oid
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID del pedido
   *       - in: path
   *         name: pid
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID del producto
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [cantidad]
   *             properties:
   *               cantidad:
   *                 type: integer
   *                 minimum: 1
   *                 description: Nueva cantidad del producto
   *     responses:
   *       200:
   *         description: Cantidad actualizada exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Order'
   *       400:
   *         $ref: '#/components/responses/BadRequestError'
   */
  router.patch("/:oid/product/:pid", controller.updateProductQuantity);

  /**
   * @swagger
   * /api/orders/{oid}:
   *   put:
   *     summary: Actualizar un pedido
   *     description: Actualiza los detalles de un pedido existente
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: oid
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID del pedido
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateOrderRequest'
   *     responses:
   *       200:
   *         description: Pedido actualizado exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Order'
   *       400:
   *         $ref: '#/components/responses/BadRequestError'
   */
  router.put("/:oid", controller.updateOrder);
  return router;
};
