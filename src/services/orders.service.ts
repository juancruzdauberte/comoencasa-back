import { db } from "../db/db";
import { ResultSetHeader } from "../../node_modules/mysql2/promise";
import { CompleteOrderDetail } from "../types/types";

export class OrderService {
  static async getOrders() {
    const conn = await db.getConnection();
    try {
      const [orders] = await conn.query("SELECT * FROM pedido");
      return orders;
    } catch (error) {
      console.error(error);
      await conn.rollback();
    } finally {
      conn.release();
    }
  }

  static async createOrder(
    products: { productId: number; quantity: number }[],
    address: string,
    deliveryTime: string,
    clientId: number
  ) {
    const conn = await db.getConnection();
    await conn.beginTransaction();

    try {
      const [order] = await conn.query<ResultSetHeader>(
        "INSERT INTO pedido (fecha, domicilio, horaEntrega, estado, cliente_id) VALUES(NOW(), ?, ?, 'pendiente', ?)",
        [address, deliveryTime, clientId]
      );

      const orderId = order.insertId;

      for (const item of products) {
        await conn.query(
          "INSERT INTO pedidodetalle(pedido_id, producto_id, cantidad) VALUES (?, ?, ?)",
          [orderId, item.productId, item.quantity]
        );
      }
      await conn.commit();
    } catch (error) {
      await conn.rollback();
      console.error(error);
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
    await conn.beginTransaction();

    try {
      await conn.query(
        `INSERT INTO pedidodetalle (pedido_id, producto_id, cantidad) VALUES (?, ?, ?)`,
        [orderId, productId, quantity]
      );
      await conn.commit();
    } catch (error) {
      await conn.rollback();
      console.error(error);
    } finally {
      conn.release();
    }
  }

  static async getOrderDetail(orderId: number) {
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query<CompleteOrderDetail[]>(
        `SELECT 
    producto.nombre,
    pedidodetalle.cantidad,
    pedido.estado,
    pagocliente.metodoPago,
    pedido.domicilio,
    pedido.horaEntrega,
    pedido.fecha,
    pedido.observacion,
    pagocliente.fechaPago,
    pagocliente.monto,
    categoria.nombre AS categoria,
    cliente.nombre AS clienteNombre,
    cliente.apellido AS clienteApellido,
    cliente.telefono AS clienteTelefono
  FROM pedidodetalle
  INNER JOIN producto ON producto.id = pedidodetalle.producto_id
  INNER JOIN pedido ON pedido.id = pedidodetalle.pedido_id
  INNER JOIN categoria ON categoria.id = producto.categoria_id
  INNER JOIN cliente ON cliente.id = pedido.cliente_id
  LEFT JOIN pagocliente ON pagocliente.pedido_id = pedido.id
  WHERE pedidodetalle.pedido_id = ?`,
        [orderId]
      );
      return {
        domicilio: rows[0].domicilio,
        metodoPago: rows[0].metodoPago,
        horaEntrega: rows[0].horaEntrega,
        monto: rows[0].monto,
        fechaPago: rows[0].fechaPago,
        fecha: rows[0].fecha,
        observacion: rows[0].observacion,
        cliente: {
          nombre: rows[0].clienteNombre,
          apellido: rows[0].clienteApellido,
          telefono: rows[0].clienteTelefono,
        },
        productos: rows.map((row) => ({
          nombre: row.nombre,
          categoria: row.categoria,
          cantidad: row.cantidad,
        })),
      };
    } catch (error) {
      await conn.rollback();
      console.log(error);
    } finally {
      conn.release();
    }
  }

  static async payOrder(pedidoId: number, metodoPago: string, monto: number) {
    const conn = await db.getConnection();
    await conn.beginTransaction();
    try {
      const [result] = await conn.query(
        `INSERT INTO pagocliente (pedido_id, metodoPago, monto, fechaPago)
       VALUES (?, ?, ?, NOW())`,
        [pedidoId, metodoPago, monto]
      );
      await conn.commit();
      return result;
    } catch (error) {
      await conn.rollback();
      console.error(error);
    } finally {
      conn.release();
    }
  }
}
