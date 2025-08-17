import { db } from "../db/db";
import {
  ResultSetHeader,
  RowDataPacket,
} from "../../node_modules/mysql2/promise";
import {
  type GetPedidosResponse,
  type ProductoInput,
  type Pedido,
} from "../types/types";
import { ErrorFactory } from "../errors/errorFactory";
import { AppError } from "../errors/errors";

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
      throw ErrorFactory.internal("Error al obtener los pedidos");
    }
  }

  static async getOrderById(orderId: number): Promise<Pedido> {
    try {
      const [[res]]: any = await db.query("CALL obtener_pedido_id(?)", [
        orderId,
      ]);
      return res[0];
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw ErrorFactory.internal("Error al obtener los pedidos");
    }
  }

  static async createOrder(
    customerName: string,
    customerSurname: string,
    customerPhone: string,
    address: string,
    deliveryTime: string,
    observation: string,
    products: ProductoInput[],
    payMethod: string,
    amount: number
  ) {
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      const [res]: any = await conn.query<RowDataPacket[]>(
        "CALL crear_pedido(?,?,?,?,?,?)",
        [
          customerName,
          customerSurname,
          customerPhone,
          address,
          deliveryTime,
          observation,
        ]
      );

      const orderId = res[0][0]?.pedido_id;

      if (!orderId) throw ErrorFactory.badRequest("Error al crear el pedido");

      await conn.query("CALL insertar_pago_pedido(?, ?, ?)", [
        orderId,
        payMethod,
        amount,
      ]);
      for (const product of products) {
        if (!Number.isInteger(product.cantidad) || product.cantidad! <= 0) {
          throw ErrorFactory.badRequest(
            `Cantidad inválida para producto ID ${product.producto_id}`
          );
        }

        await conn.query("CALL insertar_producto_pedido(?, ?, ?)", [
          orderId,
          product.producto_id,
          product.cantidad,
        ]);
      }

      await conn.commit();
      return orderId;
    } catch (error) {
      await conn.rollback();
      console.error(error);
      throw error;
    } finally {
      conn.release();
    }
  }

  static async addProductToOrder(
    orderId: number,
    productId: number,
    quantity: number
  ) {
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      if (!Number.isInteger(quantity) || quantity <= 0) {
        throw ErrorFactory.badRequest(
          "La cantidad debe ser un número mayor a cero."
        );
      }

      const [order] = await conn.query<RowDataPacket[]>(
        "SELECT id FROM pedido WHERE id = ?",
        [orderId]
      );

      if (order.length === 0) {
        throw ErrorFactory.notFound("El pedido con dicho id no existe");
      }

      const [product] = await conn.query<RowDataPacket[]>(
        "SELECT id FROM producto WHERE id = ?",
        [productId]
      );
      if (product.length === 0) {
        throw ErrorFactory.notFound("El producto con dicho id no existe");
      }

      await conn.query("CALL insertar_producto_pedido(?, ?, ?)", [
        orderId,
        productId,
        quantity,
      ]);
      await conn.commit();
    } catch (error) {
      await conn.rollback();
      console.error(error);
      throw error;
    } finally {
      conn.release();
    }
  }

  static async insertOrderDatePay(orderId: number) {
    const conn = await db.getConnection();
    await conn.beginTransaction();
    try {
      const [res] = await conn.query<ResultSetHeader>(
        "CALL insertar_fecha_pago(?)",
        [orderId]
      );

      if (res.affectedRows === 0)
        throw ErrorFactory.badRequest(
          "Error al insertar la fecha de pago del pedido"
        );
      await conn.commit();
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  static async deleteProductFromOrder(orderId: number, productId: number) {
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();
      const [result] = await conn.query<ResultSetHeader>(
        `CALL eliminar_producto_pedido (? , ?)`,
        [orderId, productId]
      );

      if (result.affectedRows === 0) {
        throw ErrorFactory.notFound(
          "Error al eliminar el producto en el pedido"
        );
      }
      await conn.commit();
    } catch (error) {
      console.error(error);
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  static async updateProductQuantity(
    orderId: number,
    productId: number,
    quantity: number
  ) {
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();
      const [detail] = await conn.query<RowDataPacket[]>(
        `
        SELECT pd.*
        FROM pedidodetalle pd
        JOIN pedido p ON pd.pedido_id = p.id
        JOIN producto pr ON pd.producto_id = pr.id
        WHERE pd.pedido_id = ? AND pd.producto_id = ?
        `,
        [orderId, productId]
      );

      if (detail.length === 0) {
        throw ErrorFactory.notFound(
          "El pedido o el producto en el pedido no existe"
        );
      }
      await conn.query("CALL actualizar_cantidad_producto(?, ?, ?)", [
        orderId,
        productId,
        quantity,
      ]);

      await conn.commit();
    } catch (error) {
      await conn.rollback();
      console.error(error);
      throw error;
    } finally {
      conn.release();
    }
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
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      const [resOrder] = await conn.query<ResultSetHeader>(
        "CALL actualizar_pedido(?, ?, ?, ?, ?)",
        [orderId, address, deliveryTime, observation, state]
      );

      const [resCustomerPay] = await conn.query<ResultSetHeader>(
        "CALL actualizar_pago_pedido(?, ?, ?)",
        [orderId, payMethod, amount]
      );

      if (resOrder.affectedRows === 0) {
        throw ErrorFactory.notFound("Pedido no encontrado");
      }

      if (resCustomerPay.affectedRows === 0) {
        throw ErrorFactory.notFound("Pago del cliente no encontrado");
      }

      for (const product of products) {
        if (
          !Number.isInteger(product.producto_id) ||
          product.producto_id <= 0
        ) {
          throw ErrorFactory.badRequest("ID de producto inválido");
        }

        await conn.query("CALL actualizar_cantidad_producto(?, ?, ?)", [
          orderId,
          product.producto_id,
          product.cantidad,
        ]);
      }

      await conn.commit();
    } catch (error) {
      await conn.rollback();
      console.error(error);
      throw error;
    } finally {
      conn.release();
    }
  }

  static async deleteOrder(orderId: number) {
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();
      const [result] = await conn.query<ResultSetHeader>(
        "CALL eliminar_pedido(?)",
        [orderId]
      );
      if (result.affectedRows === 0) {
        throw ErrorFactory.notFound("El pedido no existe");
      }
      await conn.commit();
    } catch (error) {
      await conn.rollback();
      console.error(error);
      throw error;
    } finally {
      conn.release();
    }
  }
}
