import { NextFunction, Request, Response } from "express";
import { OrderService } from "../services/orders.service";
import { ErrorFactory } from "../errors/errorFactory";
import {
  CreateOrderRequestDTO,
  OrderQueryParamsDTO,
  UpdateOrderRequestDTO,
  OrderResponseDTO,
} from "../dtos/order.dto";
import { redisClient } from "../config/redis.config";

export class OrderController {
  constructor(private orderService: OrderService) {}

  getOrders = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        filter,
        limit = 10,
        page = 1,
      } = req.query as unknown as OrderQueryParamsDTO;

      const parsedLimit = Number(limit);
      const parsedPage = Number(page);
      const offset = (parsedPage - 1) * parsedLimit;

      const { data, total } = await this.orderService.getOrders(
        filter || null,
        parsedLimit,
        offset,
      );

      const responseObject = {
        data,
        pagination: {
          currentPage: parsedPage,
          totalItems: total,
          totalPages: Math.ceil(total / parsedLimit),
        },
      };

      res.status(200).json(responseObject);
    } catch (error) {
      next(error);
    }
  };

  getOrderById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { oid } = req.params;

      const cacheKey = `orders:${oid}`;

      const reply = await redisClient.get(cacheKey);

      if (reply) {
        return res.json(JSON.parse(reply));
      }

      if (!oid) {
        throw ErrorFactory.badRequest("ID de pedido es requerido");
      }

      const data = await this.orderService.getOrderById(parseInt(oid));

      await redisClient.set(cacheKey, JSON.stringify(data), {
        EX: 150,
      });

      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  };

  createOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        domicilio,
        hora_entrega,
        observacion = "",
        productos,
        monto,
        metodo_pago,
        apellido_cliente = "",
      } = req.body as CreateOrderRequestDTO;

      const orderId = await this.orderService.createOrder({
        domicilio,
        hora_entrega,
        observacion,
        productos,
        metodo_pago,
        monto,
        apellido_cliente,
      });

      // Obtener la orden completa para tener los nombres de productos (join)
      // Esto es "rápido" porque es una búsqueda por ID indexado
      const fullOrder = (await this.orderService.getOrderById(
        orderId,
      )) as unknown as OrderResponseDTO;

      // Mapear SOLO los datos que la cocina necesita (Pattern: DTO de Evento)
      const kitchenPayload = {
        id: fullOrder.id,
        cliente: fullOrder.apellido_cliente || "Cliente",
        productos: (fullOrder.productos || []).map((p) => ({
          nombre: p.nombre, // Aseguramos enviar nombre, no solo ID
          cantidad: p.cantidad,
        })),
        observacion: fullOrder.observacion,
        hora: new Date().toLocaleTimeString("es-AR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        estado: "PENDIENTE", // Estado inicial para visualización inmediata
      };

      // Publicar evento ligero
      await redisClient.publish(
        "NEW_ORDER_TOPIC",
        JSON.stringify({
          action: "NEW_ORDER",
          order: kitchenPayload,
        }),
      );

      res
        .status(201)
        .json({ message: "Pedido creado con éxito.", id: orderId });
    } catch (error) {
      next(error);
    }
  };

  addProductToOrder = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { producto_id, pedido_id, cantidad } = req.body;

      if (!producto_id || !pedido_id || !cantidad) {
        throw ErrorFactory.badRequest("Faltan datos requeridos");
      }

      await this.orderService.addProductToOrder(
        Number(pedido_id),
        Number(producto_id),
        Number(cantidad),
      );

      res
        .status(200)
        .json({ message: "Producto agregado al pedido con éxito" });
    } catch (error) {
      next(error);
    }
  };

  insertOrderDatePay = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { oid } = req.params;

      const orderId = Number(oid);
      if (!orderId || isNaN(orderId)) {
        throw ErrorFactory.badRequest("ID de pedido inválido");
      }

      await this.orderService.insertOrderDatePay(orderId);

      const defaultCacheKey = `orders:${oid}`;
      console.log(`✅ Invalidando caché: ${defaultCacheKey}`);
      redisClient.del(defaultCacheKey);
      res.status(200).json({ message: "Pedido pagado con éxito" });
    } catch (error) {
      next(error);
    }
  };

  deleteProductFromOrder = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { oid, pid } = req.params;

      if (!oid || !pid) {
        throw ErrorFactory.badRequest("Faltan parámetros requeridos");
      }

      await this.orderService.deleteProductFromOrder(
        parseInt(oid),
        parseInt(pid),
      );

      res.status(200).json({ message: "Producto eliminado del pedido" });
    } catch (error) {
      next(error);
    }
  };

  updateProductQuantity = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { oid, pid } = req.params;
      const { cantidad } = req.body;

      if (!oid || !pid || cantidad === undefined || cantidad === null) {
        throw ErrorFactory.badRequest("Faltan datos requeridos");
      }

      await this.orderService.updateProductQuantity(
        parseInt(oid),
        parseInt(pid),
        parseInt(cantidad),
      );

      res.status(200).json({ message: "Cantidad actualizada correctamente" });
    } catch (error) {
      next(error);
    }
  };

  updateOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { oid } = req.params;

      if (!oid) {
        throw ErrorFactory.badRequest("ID de pedido no existente");
      }

      const {
        domicilio,
        hora_entrega,
        metodo_pago,
        observacion,
        estado,
        productos,
        monto,
        apellido_cliente,
      } = req.body as UpdateOrderRequestDTO;

      await this.orderService.updateOrder(Number(oid), {
        domicilio,
        hora_entrega,
        observacion,
        estado,
        metodo_pago,
        monto,
        productos,
        apellido_cliente,
      });
      const defaultCacheKey = `orders:${oid}`;
      console.log(`✅ Invalidando caché: ${defaultCacheKey}`);
      redisClient.del(defaultCacheKey);

      const fullOrder = (await this.orderService.getOrderById(
        Number(oid),
      )) as OrderResponseDTO;

      const kitchenPayload = {
        id: fullOrder.id,
        cliente: fullOrder.apellido_cliente || "Cliente",
        productos: (fullOrder.productos || []).map((p) => ({
          nombre: p.nombre,
          cantidad: p.cantidad,
        })),
        observacion: fullOrder.observacion,
        hora: new Date().toLocaleTimeString("es-AR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        estado: fullOrder.estado,
      };

      await redisClient.publish(
        "NEW_ORDER_TOPIC",
        JSON.stringify({
          action: "UPDATE_ORDER",
          order: kitchenPayload,
        }),
      );

      res.status(200).json({ message: "Pedido actualizado correctamente" });
    } catch (error) {
      next(error);
    }
  };

  deleteOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { oid } = req.params;

      if (!oid) {
        throw ErrorFactory.badRequest("Error: no existe un pedido con ese ID");
      }

      await this.orderService.deleteOrder(parseInt(oid));
      res.status(200).json({ message: "Pedido eliminado correctamente" });
    } catch (error) {
      next(error);
    }
  };
}
