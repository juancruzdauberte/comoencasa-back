import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { db } from "../db/db";
import { OrderResponseDTO, ProductCreateOrderDTO } from "../dtos/order.dto";
import { ErrorFactory } from "../errors/errorFactory";
import { AppError } from "../errors/errors";
import { IOrderRepository } from "../interfaces/order.interface";
import { StoredProcedureResultWithTotal } from "../interfaces/repository.interface";
import { batchInsert, withTransaction } from "../utils/database.utils";
import { secureLogger } from "../config/logger";

export class OrderRepository implements IOrderRepository {
  async getConnection(): Promise<PoolConnection> {
    return await db.getConnection();
  }

  async findAll(
    filter: string | null,
    limit: number,
    offset: number
  ): Promise<StoredProcedureResultWithTotal<OrderResponseDTO>> {
    try {
      const [res]: any = await db.query(`CALL obtener_pedidos(?, ?, ?)`, [
        filter,
        limit,
        offset,
      ]);

      if (!res || res.length === 0) {
        throw ErrorFactory.badRequest("Error al obtener todos los pedidos");
      }

      const data = res[0] as OrderResponseDTO[];
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

  async findById(id: number): Promise<OrderResponseDTO | null> {
    try {
      const [[res]]: any = await db.query("CALL obtener_pedido_id(?)", [id]);

      if (!res || res.length === 0) {
        return null;
      }

      return res[0] as OrderResponseDTO;
    } catch (error) {
      secureLogger.error("Error fetching order by ID", error, { orderId: id });
      throw ErrorFactory.internal("Error al obtener el pedido");
    }
  }
  async create(
    address: string,
    deliveryTime: string,
    observation: string,
    products: ProductCreateOrderDTO[],
    payMethod: string,
    amount: number,
    clientSurname: string
  ): Promise<number> {
    return withTransaction(async (conn) => {
      const [res] = await conn.query<RowDataPacket[][]>(
        "CALL crear_pedido(?,?,?,?)",
        [address, deliveryTime, observation, clientSurname]
      );

      const orderId = res[0][0]?.pedido_id;
      if (!orderId) {
        throw ErrorFactory.badRequest("Error al crear el pedido");
      }

      const payExists = await this.payExistsInOrder(orderId, conn);
      if (payExists === 0) {
        await conn.query(
          "INSERT INTO pagocliente(pedido_id, metodoPago, monto) VALUES (?, ?, ?)",
          [orderId, payMethod, amount]
        );
      }
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
    });
  }

  async addProduct(
    orderId: number,
    productId: number,
    quantity: number
  ): Promise<void> {
    const conn = await this.getConnection();

    try {
      await conn.beginTransaction();

      const productInOrder = await this.productExistsInOrder(
        orderId,
        productId
      );

      if (!productInOrder) {
        await conn.query(
          "INSERT INTO pedidodetalle (pedido_id, producto_id, cantidad) VALUES (?, ?, ?);",
          [orderId, productId, quantity]
        );
      }

      await conn.commit();

      secureLogger.info("Product added to order", {
        orderId,
        productId,
        quantity,
      });
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  async insertPaymentDate(orderId: number): Promise<void> {
    const conn = await this.getConnection();

    try {
      await conn.beginTransaction();

      const [res] = await conn.query<ResultSetHeader>(
        " UPDATE pagocliente SET fechaPago = DATE_SUB(NOW(), INTERVAL 3 HOUR) WHERE pedido_id = ? AND fechaPago IS NULL",
        [orderId]
      );

      if (res.affectedRows === 0) {
        throw ErrorFactory.badRequest(
          "Error al insertar la fecha de pago del pedido"
        );
      }

      await conn.commit();

      secureLogger.info("Payment date inserted for order", { orderId });
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  async deleteProduct(orderId: number, productId: number): Promise<void> {
    const conn = await this.getConnection();

    try {
      await conn.beginTransaction();

      const [result] = await conn.query<ResultSetHeader>(
        `DELETE FROM pedidodetalle AS pd WHERE pd.pedido_id = ? AND pd.producto_id = ?; `,
        [orderId, productId]
      );

      if (result.affectedRows === 0) {
        throw ErrorFactory.notFound(
          `Producto ${productId} no encontrado en pedido ${orderId}`
        );
      }

      await conn.commit();

      secureLogger.info("Product removed from order", {
        orderId,
        productId,
      });
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  async delete(orderId: number): Promise<void> {
    const conn = await this.getConnection();

    try {
      await conn.beginTransaction();

      const [result] = await conn.query<ResultSetHeader>(
        "DELETE FROM pedido AS p WHERE p.id = ?;",
        [orderId]
      );

      if (result.affectedRows === 0) {
        throw ErrorFactory.notFound(`Pedido con ID ${orderId} no existe`);
      }

      await conn.commit();

      secureLogger.info("Order deleted successfully", { orderId });
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  async update(
    orderId: string,
    address: string,
    deliveryTime: string,
    observation: string,
    state: string,
    payMethod: string,
    amount: number,
    products: ProductCreateOrderDTO[],
    clientSurame: string
  ): Promise<void> {
    const conn = await this.getConnection();

    try {
      await conn.beginTransaction();

      await conn.query(
        " UPDATE pedido AS p SET p.domicilio = ?, p.horaEntrega = ?, p.observacion = ?, p.estado = ?, p.apellido_cliente = ? WHERE p.id = ?",
        [address, deliveryTime, observation, state, clientSurame, orderId]
      );

      await conn.query(
        "UPDATE pagocliente SET metodoPago = ?, monto = ? WHERE pedido_id = ?",
        [payMethod, amount, orderId]
      );

      for (const product of products) {
        await conn.query("CALL actualizar_cantidad_producto(?, ?, ?)", [
          orderId,
          product.producto_id,
          product.cantidad,
        ]);
      }

      await conn.commit();

      secureLogger.info("Order updated successfully", {
        orderId,
        productsCount: products.length,
      });
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  async updateProductQuantity(
    orderId: number,
    productId: number,
    quantity: number
  ): Promise<void> {
    const conn = await this.getConnection();

    try {
      await conn.beginTransaction();

      await conn.query("CALL actualizar_cantidad_producto(?, ?, ?)", [
        orderId,
        productId,
        quantity,
      ]);

      await conn.commit();

      secureLogger.info("Product quantity updated", {
        orderId,
        productId,
        quantity,
      });
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  async orderExists(orderId: number, conn?: PoolConnection): Promise<boolean> {
    const connection = conn || (await this.getConnection());

    try {
      const [rows] = await connection.query<RowDataPacket[]>(
        "SELECT id FROM pedido WHERE id = ? LIMIT 1",
        [orderId]
      );

      return rows.length > 0;
    } finally {
      if (!conn) connection.release();
    }
  }

  async productExists(
    productId: number,
    conn?: PoolConnection
  ): Promise<boolean> {
    const connection = conn || (await this.getConnection());

    try {
      const [rows] = await connection.query<RowDataPacket[]>(
        "SELECT id FROM producto WHERE id = ? LIMIT 1",
        [productId]
      );

      return rows.length > 0;
    } finally {
      if (!conn) connection.release();
    }
  }

  async productExistsInOrder(
    orderId: number,
    productId: number,
    conn?: PoolConnection
  ): Promise<boolean> {
    const connection = conn || (await this.getConnection());

    try {
      const [rows] = await connection.query<RowDataPacket[]>(
        `SELECT pd.* FROM pedidodetalle pd
         WHERE pd.pedido_id = ? AND pd.producto_id = ?
         LIMIT 1`,
        [orderId, productId]
      );

      return rows.length > 0;
    } finally {
      if (!conn) connection.release();
    }
  }

  async payExistsInOrder(
    orderId: number,
    conn?: PoolConnection
  ): Promise<number> {
    const connection = conn || (await this.getConnection());

    try {
      const [rows] = await connection.query<RowDataPacket[]>(
        `  SELECT COUNT(*) AS pago_existente
  FROM pagocliente
  WHERE pedido_id = ?`,
        [orderId]
      );

      const count = rows[0]?.pago_existente ?? 0;
      return count;
    } finally {
      if (!conn) connection.release();
    }
  }
}
