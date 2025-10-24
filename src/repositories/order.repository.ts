import { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { db } from '../db/db';
import { OrderResponseDTO, ProductCreateOrderDTO } from '../dtos/order.dto';
import { ErrorFactory } from '../errors/errorFactory';
import { AppError } from '../errors/errors';
import { IOrderRepository } from '../interfaces/order.interface';
import { StoredProcedureResultWithTotal } from '../interfaces/repository.interface';
import { secureLogger } from '../config/logger';
import { batchInsert } from '../utils/database.utils';

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
        throw ErrorFactory.badRequest('Error al obtener todos los pedidos');
      }

      const data = res[0] as OrderResponseDTO[];
      const total = res[1]?.[0]?.total || 0;

      return { data, total };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      secureLogger.error('Error fetching orders', error, {
        filter,
        limit,
        offset,
      });
      throw ErrorFactory.internal('Error al obtener los pedidos');
    }
  }

  async findById(id: number): Promise<OrderResponseDTO | null> {
    try {
      const [[res]]: any = await db.query('CALL obtener_pedido_id(?)', [id]);

      if (!res || res.length === 0) {
        return null;
      }

      return res[0] as OrderResponseDTO;
    } catch (error) {
      secureLogger.error('Error fetching order by ID', error, { orderId: id });
      throw ErrorFactory.internal('Error al obtener el pedido');
    }
  }

  async create(
    address: string,
    deliveryTime: string,
    observation: string,
    products: ProductCreateOrderDTO[],
    payMethod: string,
    amount: number
  ): Promise<number> {
    const conn = await this.getConnection();

    try {
      await conn.beginTransaction();

      // Crear pedido
      const [res] = await conn.query<RowDataPacket[][]>(
        'CALL crear_pedido(?,?,?)',
        [address, deliveryTime, observation]
      );

      const orderId = res[0][0]?.pedido_id;

      if (!orderId) {
        throw ErrorFactory.badRequest('Error al crear el pedido');
      }

      // Insertar información de pago
      await conn.query('CALL insertar_pago_pedido(?, ?, ?)', [
        orderId,
        payMethod,
        amount,
      ]);

      // Insertar productos en batch
      const productValues = products.map((p) => [
        orderId,
        p.producto_id,
        p.cantidad,
      ]);

      await batchInsert(
        conn,
        'pedidodetalle',
        ['pedido_id', 'producto_id', 'cantidad'],
        productValues
      );

      await conn.commit();

      secureLogger.info('Order created successfully', {
        orderId,
        productsCount: products.length,
      });

      return orderId;
    } catch (error) {
      await conn.rollback();
      secureLogger.error('Error creating order', error, {
        productsCount: products.length,
      });
      throw error;
    } finally {
      conn.release();
    }
  }

  async addProduct(
    orderId: number,
    productId: number,
    quantity: number
  ): Promise<void> {
    const conn = await this.getConnection();

    try {
      await conn.beginTransaction();

      await conn.query('CALL insertar_producto_pedido(?, ?, ?)', [
        orderId,
        productId,
        quantity,
      ]);

      await conn.commit();

      secureLogger.info('Product added to order', {
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
        'CALL insertar_fecha_pago(?)',
        [orderId]
      );

      if (res.affectedRows === 0) {
        throw ErrorFactory.badRequest(
          'Error al insertar la fecha de pago del pedido'
        );
      }

      await conn.commit();

      secureLogger.info('Payment date inserted for order', { orderId });
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
        `CALL eliminar_producto_pedido (?, ?)`,
        [orderId, productId]
      );

      if (result.affectedRows === 0) {
        throw ErrorFactory.notFound(
          `Producto ${productId} no encontrado en pedido ${orderId}`
        );
      }

      await conn.commit();

      secureLogger.info('Product removed from order', {
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
        'CALL eliminar_pedido(?)',
        [orderId]
      );

      if (result.affectedRows === 0) {
        throw ErrorFactory.notFound(`Pedido con ID ${orderId} no existe`);
      }

      await conn.commit();

      secureLogger.info('Order deleted successfully', { orderId });
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
    products: ProductCreateOrderDTO[]
  ): Promise<void> {
    const conn = await this.getConnection();

    try {
      await conn.beginTransaction();

      // Actualizar pedido
      await conn.query('CALL actualizar_pedido(?, ?, ?, ?, ?)', [
        orderId,
        address,
        deliveryTime,
        observation,
        state,
      ]);

      // Actualizar pago
      await conn.query('CALL actualizar_pago_pedido(?, ?, ?)', [
        orderId,
        payMethod,
        amount,
      ]);

      // Actualizar productos
      for (const product of products) {
        await conn.query('CALL actualizar_cantidad_producto(?, ?, ?)', [
          orderId,
          product.producto_id,
          product.cantidad,
        ]);
      }

      await conn.commit();

      secureLogger.info('Order updated successfully', {
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

      await conn.query('CALL actualizar_cantidad_producto(?, ?, ?)', [
        orderId,
        productId,
        quantity,
      ]);

      await conn.commit();

      secureLogger.info('Product quantity updated', {
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

  async orderExists(
    orderId: number,
    conn?: PoolConnection
  ): Promise<boolean> {
    const connection = conn || (await this.getConnection());

    try {
      const [rows] = await connection.query<RowDataPacket[]>(
        'SELECT id FROM pedido WHERE id = ? LIMIT 1',
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
        'SELECT id FROM producto WHERE id = ? LIMIT 1',
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
}
