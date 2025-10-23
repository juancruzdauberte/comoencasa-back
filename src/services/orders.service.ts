import { db } from "../db/db";
import { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import {
  type GetPedidosResponse,
  type ProductoInput,
  type Pedido,
} from "../types/types";
import { ErrorFactory } from "../errors/errorFactory";
import { AppError } from "../errors/errors";
import { withTransaction, batchInsert } from "../utils/database.utils";
import { secureLogger } from "../config/logger";

export class OrderService {
  static async getOrders(
    filter: string | null,
    limit: number,
    offset: number
  ): Promise<GetPedidosResponse> {
    try {
      const [res]: any = await db.query(`CALL obtener_pedidos(?, ?, ?)`, [
        filter,
        limit,
        offset,
      ]);

      if (res.length === 0) {
        throw ErrorFactory.badRequest("Error al obtener todos los pedidos");
      }

      const data = res[0];
      const total = res[1]?.[0]?.total || 0;

      return { data, total };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      secureLogger.error("Error fetching orders", error, {
        filter,
        limit,
        offset,
      });
      throw ErrorFactory.internal("Error al obtener los pedidos");
    }
  }

  static async getOrderById(orderId: number): Promise<Pedido> {
    try {
      const [[res]]: any = await db.query("CALL obtener_pedido_id(?)", [
        orderId,
      ]);

      if (!res || res.length === 0) {
        throw ErrorFactory.notFound(`Pedido con ID ${orderId} no encontrado`);
      }

      return res[0];
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      secureLogger.error("Error fetching order by ID", error, { orderId });
      throw ErrorFactory.internal("Error al obtener el pedido");
    }
  }

  static async createOrder(
    address: string,
    deliveryTime: string,
    observation: string,
    products: ProductoInput[],
    payMethod: string,
    amount: number
  ) {
    // Validaciones previas
    if (!products || products.length === 0) {
      throw ErrorFactory.badRequest("Debe incluir al menos un producto");
    }

    // Validar todos los productos antes de iniciar transacción
    const invalidProducts = products.filter(
      (p) => !Number.isInteger(p.cantidad) || (p.cantidad && p.cantidad <= 0)
    );

    if (invalidProducts.length > 0) {
      const ids = invalidProducts.map((p) => p.producto_id).join(", ");
      throw ErrorFactory.badRequest(
        `Productos con cantidades inválidas: ${ids}`
      );
    }

    return withTransaction(async (conn) => {
      try {
        // Crear pedido
        const [res] = await conn.query<RowDataPacket[][]>(
          "CALL crear_pedido(?,?,?)",
          [address, deliveryTime, observation]
        );

        const orderId = res[0][0]?.pedido_id;

        if (!orderId) {
          throw ErrorFactory.badRequest("Error al crear el pedido");
        }

        // Insertar información de pago
        await conn.query("CALL insertar_pago_pedido(?, ?, ?)", [
          orderId,
          payMethod,
          amount,
        ]);

        // Insertar productos en batch (más eficiente)
        const productValues = products.map((p) => [
          orderId,
          p.producto_id,
          p.cantidad,
        ]);

        await batchInsert(
          conn,
          "pedidodetalle",
          ["pedido_id", "producto_id", "cantidad"],
          productValues
        );

        secureLogger.info("Order created successfully", {
          orderId,
          productsCount: products.length,
        });

        return orderId;
      } catch (error) {
        secureLogger.error("Error creating order", error, {
          productsCount: products.length,
        });
        throw error;
      }
    });
  }

  static async addProductToOrder(
    orderId: number,
    productId: number,
    quantity: number
  ) {
    return withTransaction(async (conn) => {
      // Validar cantidad
      if (!Number.isInteger(quantity) || quantity <= 0) {
        throw ErrorFactory.badRequest(
          "La cantidad debe ser un número mayor a cero."
        );
      }

      // Verificar que el pedido existe
      const [order] = await conn.query<RowDataPacket[]>(
        "SELECT id FROM pedido WHERE id = ? LIMIT 1",
        [orderId]
      );

      if (order.length === 0) {
        throw ErrorFactory.notFound(`Pedido con ID ${orderId} no existe`);
      }

      // Verificar que el producto existe
      const [product] = await conn.query<RowDataPacket[]>(
        "SELECT id FROM producto WHERE id = ? LIMIT 1",
        [productId]
      );

      if (product.length === 0) {
        throw ErrorFactory.notFound(`Producto con ID ${productId} no existe`);
      }

      // Agregar producto al pedido
      await conn.query("CALL insertar_producto_pedido(?, ?, ?)", [
        orderId,
        productId,
        quantity,
      ]);

      secureLogger.info("Product added to order", {
        orderId,
        productId,
        quantity,
      });
    });
  }

  static async insertOrderDatePay(orderId: number) {
    return withTransaction(async (conn) => {
      const [res] = await conn.query<ResultSetHeader>(
        "CALL insertar_fecha_pago(?)",
        [orderId]
      );

      if (res.affectedRows === 0) {
        throw ErrorFactory.badRequest(
          "Error al insertar la fecha de pago del pedido"
        );
      }

      secureLogger.info("Payment date inserted for order", { orderId });
    });
  }

  static async deleteProductFromOrder(orderId: number, productId: number) {
    return withTransaction(async (conn) => {
      const [result] = await conn.query<ResultSetHeader>(
        `CALL eliminar_producto_pedido (?, ?)`,
        [orderId, productId]
      );

      if (result.affectedRows === 0) {
        throw ErrorFactory.notFound(
          `Producto ${productId} no encontrado en pedido ${orderId}`
        );
      }

      secureLogger.info("Product removed from order", {
        orderId,
        productId,
      });
    });
  }

  static async updateProductQuantity(
    orderId: number,
    productId: number,
    quantity: number
  ) {
    return withTransaction(async (conn) => {
      // Validar cantidad
      if (!Number.isInteger(quantity) || quantity <= 0) {
        throw ErrorFactory.badRequest("La cantidad debe ser mayor a cero");
      }

      // Verificar que el producto existe en el pedido
      const [detail] = await conn.query<RowDataPacket[]>(
        `SELECT pd.* FROM pedidodetalle pd
         WHERE pd.pedido_id = ? AND pd.producto_id = ?
         LIMIT 1`,
        [orderId, productId]
      );

      if (detail.length === 0) {
        throw ErrorFactory.notFound(
          `Producto ${productId} no encontrado en pedido ${orderId}`
        );
      }

      // Actualizar cantidad
      await conn.query("CALL actualizar_cantidad_producto(?, ?, ?)", [
        orderId,
        productId,
        quantity,
      ]);

      secureLogger.info("Product quantity updated", {
        orderId,
        productId,
        quantity,
      });
    });
  }

  static async updateOrder(
    orderId: string,
    address: string,
    deliveryTime: string,
    observation: string,
    state: string,
    payMethod: string,
    amount: number,
    products: ProductoInput[]
  ) {
    return withTransaction(async (conn) => {
      // 1. Validar existencia del pedido PRIMERO
      const [orderExists] = await conn.query<RowDataPacket[]>(
        "SELECT id FROM pedido WHERE id = ? LIMIT 1",
        [orderId]
      );

      if (orderExists.length === 0) {
        throw ErrorFactory.notFound(`Pedido con ID ${orderId} no existe`);
      }

      // 2. Validar todos los productos antes de actualizar
      for (const product of products) {
        if (
          !Number.isInteger(product.producto_id) ||
          product.producto_id <= 0
        ) {
          throw ErrorFactory.badRequest(
            `ID de producto inválido: ${product.producto_id}`
          );
        }

        if (
          !Number.isInteger(product.cantidad) ||
          (product.cantidad && product.cantidad <= 0)
        ) {
          throw ErrorFactory.badRequest(
            `Cantidad inválida para producto ${product.producto_id}: ${product.cantidad}`
          );
        }

        // Validar que el producto existe
        const [productExists] = await conn.query<RowDataPacket[]>(
          "SELECT id FROM producto WHERE id = ? LIMIT 1",
          [product.producto_id]
        );

        if (productExists.length === 0) {
          throw ErrorFactory.notFound(
            `Producto con ID ${product.producto_id} no existe`
          );
        }
      }

      // 3. Actualizar pedido
      await conn.query("CALL actualizar_pedido(?, ?, ?, ?, ?)", [
        orderId,
        address,
        deliveryTime,
        observation,
        state,
      ]);

      // 4. Actualizar pago
      await conn.query("CALL actualizar_pago_pedido(?, ?, ?)", [
        orderId,
        payMethod,
        amount,
      ]);

      // 5. Actualizar productos
      for (const product of products) {
        await conn.query("CALL actualizar_cantidad_producto(?, ?, ?)", [
          orderId,
          product.producto_id,
          product.cantidad,
        ]);
      }

      secureLogger.info("Order updated successfully", {
        orderId,
        productsCount: products.length,
      });
    });
  }

  static async deleteOrder(orderId: number) {
    return withTransaction(async (conn) => {
      const [result] = await conn.query<ResultSetHeader>(
        "CALL eliminar_pedido(?)",
        [orderId]
      );

      if (result.affectedRows === 0) {
        throw ErrorFactory.notFound(`Pedido con ID ${orderId} no existe`);
      }

      secureLogger.info("Order deleted successfully", { orderId });
    });
  }
}
