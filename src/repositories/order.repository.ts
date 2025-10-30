import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { db } from "../db/db";
import { OrderResponseDTO, ProductCreateOrderDTO } from "../dtos/order.dto";
import { ErrorFactory } from "../errors/errorFactory";
import { AppError } from "../errors/errors";
import { IOrderRepository } from "../interfaces/order.interface";
import { StoredProcedureResultWithTotal } from "../interfaces/repository.interface";
import { batchInsert } from "../utils/database.utils";
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

      if (!res || !res[0] || res[0].length === 0) {
        return { data: [], total: 0 };
      }

      const data = res[0] as OrderResponseDTO[];
      const total = res[1]?.[0]?.total || 0;

      return { data, total };
    } catch (error) {
      if (error instanceof AppError) throw error;
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
    data: {
      address: string;
      deliveryTime: string;
      observation: string;
      clientSurname: string;
    },
    conn: PoolConnection
  ): Promise<number> {
    const [res] = await conn.query<RowDataPacket[][]>(
      "CALL crear_pedido(?,?,?,?)",
      [data.address, data.deliveryTime, data.observation, data.clientSurname]
    );

    const orderId = res[0][0]?.pedido_id;
    if (!orderId) {
      throw new Error("Error en SP 'crear_pedido': no se devolvió ID.");
    }
    return orderId;
  }

  async createOrderPayment(
    orderId: number,
    payMethod: string,
    amount: number,
    conn: PoolConnection
  ): Promise<void> {
    await conn.query(
      "INSERT INTO pagocliente(pedido_id, metodoPago, monto) VALUES (?, ?, ?)",
      [orderId, payMethod, amount]
    );
  }

  async createOrderDetails(
    orderId: number,
    products: ProductCreateOrderDTO[],
    conn: PoolConnection
  ): Promise<void> {
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
  }

  async addProduct(
    orderId: number,
    productId: number,
    quantity: number,
    conn: PoolConnection
  ): Promise<void> {
    await conn.query(
      "INSERT INTO pedidodetalle (pedido_id, producto_id, cantidad) VALUES (?, ?, ?);",
      [orderId, productId, quantity]
    );
  }

  async insertPaymentDate(
    orderId: number,
    conn: PoolConnection
  ): Promise<ResultSetHeader> {
    const [res] = await conn.query<ResultSetHeader>(
      "UPDATE pagocliente SET fechaPago = DATE_SUB(NOW(), INTERVAL 3 HOUR) WHERE pedido_id = ? AND fechaPago IS NULL",
      [orderId]
    );
    return res;
  }

  async deleteProduct(
    orderId: number,
    productId: number,
    conn: PoolConnection
  ): Promise<ResultSetHeader> {
    const [result] = await conn.query<ResultSetHeader>(
      `DELETE FROM pedidodetalle AS pd WHERE pd.pedido_id = ? AND pd.producto_id = ?;`,
      [orderId, productId]
    );
    return result;
  }

  async delete(
    orderId: number,
    conn: PoolConnection
  ): Promise<ResultSetHeader> {
    const [result] = await conn.query<ResultSetHeader>(
      "DELETE FROM pedido AS p WHERE p.id = ?;",
      [orderId]
    );
    return result;
  }

  async update(
    orderId: number,
    data: {
      address: string;
      deliveryTime: string;
      observation: string;
      state: string;
      clientSurname: string;
    },
    conn: PoolConnection
  ): Promise<void> {
    await conn.query(
      "UPDATE pedido AS p SET p.domicilio = ?, p.horaEntrega = ?, p.observacion = ?, p.estado = ?, p.apellido_cliente = ? WHERE p.id = ?",
      [
        data.address,
        data.deliveryTime,
        data.observation,
        data.state,
        data.clientSurname,
        orderId,
      ]
    );
  }

  async updateOrderPayment(
    orderId: number,
    payMethod: string,
    amount: number,
    conn: PoolConnection
  ): Promise<void> {
    await conn.query(
      "UPDATE pagocliente SET metodoPago = ?, monto = ? WHERE pedido_id = ?",
      [payMethod, amount, orderId]
    );
  }

  async updateProductQuantity(
    orderId: number,
    productId: number,
    quantity: number,
    conn: PoolConnection
  ): Promise<void> {
    await conn.query("CALL actualizar_cantidad_producto(?, ?, ?)", [
      orderId,
      productId,
      quantity,
    ]);
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
        `SELECT COUNT(*) AS pago_existente
         FROM pagocliente
         WHERE pedido_id = ?`,
        [orderId]
      );
      return rows[0]?.pago_existente ?? 0;
    } finally {
      if (!conn) connection.release();
    }
  }
}
