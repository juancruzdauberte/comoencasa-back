import { db } from "../db/db";
import { ResultSetHeader } from "../../node_modules/mysql2/promise";
import {
  CompleteOrderDetail,
  Customer,
  CustomerQuery,
  GetAllOrders,
  GetOrderId,
  GetProductId,
  OrderDetail,
  PayOrder,
  UpdateOrder,
} from "../types/types";
import { BadRequestError, NotFoundError } from "../errors/errors";

export class OrderService {
  static async getOrders() {
    const conn = await db.getConnection();
    try {
      const [orders] = await conn.query<GetAllOrders[]>(
        `SELECT
  p.id,
  p.horaEntrega,
  p.domicilio,
  p.estado,
  p.entregado,
  p.observacion,
  c.nombre AS nombreCliente,
  c.apellido AS apellidoCliente,
  pc.monto,
  pc.fechaPago,
  JSON_OBJECTAGG(
    IFNULL(productosAgrupados.categoria, 'Sin categoría'),
    productosAgrupados.productos
  ) AS productos
FROM pedido AS p
INNER JOIN cliente AS c ON c.id = p.cliente_id
LEFT JOIN pagocliente AS pc ON pc.pedido_id = p.id
LEFT JOIN (
  SELECT
    pd.pedido_id,
    cat.nombre AS categoria,
    JSON_ARRAYAGG(
      JSON_OBJECT(
        'nombre', pr.nombre,
        'cantidad', pd.cantidad
      )
    ) AS productos
  FROM pedidodetalle AS pd
  INNER JOIN producto AS pr ON pr.id = pd.producto_id
  LEFT JOIN categoria AS cat ON cat.id = pr.categoria_id
  GROUP BY pd.pedido_id, cat.nombre
) AS productosAgrupados ON productosAgrupados.pedido_id = p.id

GROUP BY p.id, p.horaEntrega, p.domicilio, c.nombre, c.apellido, pc.monto, pc.fechaPago;
`
      );

      if (orders.length === 0) {
        throw new BadRequestError("Error al obtener todos los pedidos");
      }
      return { pedidos: orders };
    } catch (error) {
      console.error(error);
      await conn.rollback();
    } finally {
      conn.release();
    }
  }

  static async getOrdersToday() {
    const conn = await db.getConnection();
    try {
      const [orders] = await conn.query<GetAllOrders[]>(
        `SELECT
  p.id,
  p.horaEntrega,
  p.domicilio,
  p.entregado,
  p.estado,
  p.observacion,
  c.nombre AS nombreCliente,
  c.apellido AS apellidoCliente,
  pc.monto,
  pc.fechaPago,
  JSON_OBJECTAGG(
    IFNULL(productosAgrupados.categoria, 'Sin categoría'),
    productosAgrupados.productos
  ) AS productos
FROM pedido AS p
INNER JOIN cliente AS c ON c.id = p.cliente_id
LEFT JOIN pagocliente AS pc ON pc.pedido_id = p.id
LEFT JOIN (
  SELECT
    pd.pedido_id,
    cat.nombre AS categoria,
    JSON_ARRAYAGG(
      JSON_OBJECT(
        'nombre', pr.nombre,
        'cantidad', pd.cantidad
      )
    ) AS productos
  FROM pedidodetalle AS pd
  INNER JOIN producto AS pr ON pr.id = pd.producto_id
  LEFT JOIN categoria AS cat ON cat.id = pr.categoria_id
  GROUP BY pd.pedido_id, cat.nombre
) AS productosAgrupados ON productosAgrupados.pedido_id = p.id

WHERE DATE(p.fecha) = CURDATE() AND p.estado IN ('preparando', 'listo')

GROUP BY p.id, p.horaEntrega, p.domicilio, c.nombre, c.apellido, pc.monto, pc.fechaPago;
`
      );

      if (orders.length === 0) {
        throw new BadRequestError("Error al obtener todos los pedidos");
      }
      return { pedidos: orders };
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
    observation: string,
    client: Customer
  ) {
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      const [clientResult] = await conn.query<CustomerQuery[]>(
        "SELECT id FROM cliente WHERE telefono = ?",
        [client.telefono]
      );

      let clientId: number;
      if (clientResult.length > 0) {
        clientId = clientResult[0].id;
      } else {
        const [newClient] = await conn.query<ResultSetHeader>(
          "INSERT INTO cliente (nombre, apellido, telefono) VALUES (?, ?, ?)",
          [client.nombre, client.apellido, client.telefono]
        );
        clientId = newClient.insertId;
      }

      const [order] = await conn.query<ResultSetHeader>(
        "INSERT INTO pedido (fecha, domicilio, horaEntrega, estado, cliente_id, observacion) VALUES(NOW(), ?, ?, 'pendiente', ?, ?)",
        [address, deliveryTime, clientId, observation]
      );

      const orderId = order.insertId;

      for (const item of products) {
        await conn.query(
          "INSERT INTO pedidodetalle(pedido_id, producto_id, cantidad) VALUES (?, ?, ?)",
          [orderId, item.productId, item.quantity]
        );
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
        throw new BadRequestError(
          "La cantidad debe ser un número mayor a cero."
        );
      }

      const [pedido] = await conn.query<GetOrderId[]>(
        `SELECT id FROM pedido WHERE id = ?`,
        [orderId]
      );
      if (pedido.length === 0) {
        throw new NotFoundError("El pedido no existe.");
      }

      const [producto] = await conn.query<GetProductId[]>(
        `SELECT id FROM producto WHERE id = ?`,
        [productId]
      );
      if (producto.length === 0) {
        throw new NotFoundError("El producto no existe.");
      }

      const [rows] = await conn.query<OrderDetail[]>(
        `SELECT cantidad FROM pedidodetalle WHERE pedido_id = ? AND producto_id = ?`,
        [orderId, productId]
      );

      if (rows.length > 0) {
        const newQuantity = rows[0].cantidad + quantity;
        await conn.query(
          `UPDATE pedidodetalle SET cantidad = ? WHERE pedido_id = ? AND producto_id = ?`,
          [newQuantity, orderId, productId]
        );
      } else {
        await conn.query(
          `INSERT INTO pedidodetalle (pedido_id, producto_id, cantidad) VALUES (?, ?, ?)`,
          [orderId, productId, quantity]
        );
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

  static async getOrderDetail(orderId: number) {
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query<CompleteOrderDetail[]>(
        `SELECT 
  pr.nombre as productName,
  pd.cantidad,
  o.estado,
  o.domicilio,
  o.horaEntrega,
  o.fecha,
  o.observacion,
  pg.fechaPago,
  pg.metodoPago,
  pg.monto,
  cat.nombre AS categoria,
  cus.nombre AS clienteNombre,
  cus.apellido AS clienteApellido,
  cus.telefono AS clienteTelefono
FROM pedidodetalle AS pd
INNER JOIN producto AS pr ON pr.id = pd.producto_id
INNER JOIN pedido AS o ON o.id = pd.pedido_id
INNER JOIN categoria AS cat ON cat.id = pr.categoria_id
INNER JOIN cliente AS cus ON cus.id = o.cliente_id
LEFT JOIN pagocliente AS pg ON pg.pedido_id = o.id
WHERE pd.pedido_id = ?`,
        [orderId]
      );
      return {
        pedido: {
          domicilio: rows[0].domicilio,
          horaEntrega: rows[0].horaEntrega,
          monto: rows[0].monto,
          fechaPago: rows[0].fechaPago,
          metodoPago: rows[0].metodoPago,
          fecha: rows[0].fecha,
          observacion: rows[0].observacion,
          cliente: {
            nombre: rows[0].clienteNombre,
            apellido: rows[0].clienteApellido,
            telefono: rows[0].clienteTelefono,
          },
          productos: rows.map((row) => ({
            nombre: row.productName,
            categoria: row.categoria,
            cantidad: row.cantidad,
          })),
        },
      };
    } catch (error) {
      await conn.rollback();
      console.log(error);
      throw error;
    } finally {
      conn.release();
    }
  }

  static async payOrder(
    orderId: number,
    paymentMethod: string,
    amount: number
  ) {
    const conn = await db.getConnection();
    await conn.beginTransaction();
    try {
      const [order] = await conn.query<GetOrderId[]>(
        "SELECT id FROM pedido WHERE id = ?",
        [orderId]
      );

      if (order.length === 0) {
        throw new NotFoundError("El pedido con dicho id no existe");
      }

      const [existingPayment] = await conn.query<PayOrder[]>(
        "SELECT * FROM pagocliente WHERE pedido_id = ?",
        [orderId]
      );

      if (existingPayment.length > 0) {
        throw new BadRequestError("El pedido ya está pago");
      }
      const [res] = await conn.query<PayOrder[]>(
        `INSERT INTO pagocliente (pedido_id, metodoPago, monto, fechaPago)
       VALUES (?, ?, ?, NOW())`,
        [orderId, paymentMethod, amount]
      );
      if (res[0].fechaPago !== null) {
        throw new BadRequestError("El pedido ya esta pago");
      }
      await conn.commit();
      return res;
    } catch (error) {
      await conn.rollback();
      console.error(error);
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
        `DELETE FROM pedidodetalle WHERE pedido_id = ? AND producto_id = ?`,
        [orderId, productId]
      );

      if (result.affectedRows === 0) {
        throw new NotFoundError("Error al eliminar el producto en el pedido");
      }
      await conn.commit();
      return result.affectedRows;
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
      const [detail] = await conn.query<OrderDetail[]>(
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
        throw new NotFoundError(
          "El pedido o el producto en el pedido no existe"
        );
      }
      const [result] = await conn.query<ResultSetHeader>(
        "UPDATE pedidodetalle SET cantidad = ? WHERE pedido_id = ? AND producto_id = ?",
        [quantity, orderId, productId]
      );

      await conn.commit();
      return result.affectedRows;
    } catch (error) {
      await conn.rollback();
      console.error(error);
      throw error;
    } finally {
      conn.release();
    }
  }

  static async updateOrder(orderId: string, data: UpdateOrder) {
    const conn = await db.getConnection();
    const {
      pedido: { domicilio, horaEntrega, observacion },
      pagoCliente: { fechaPago, metodoPago },
    } = data;
    try {
      await conn.beginTransaction();
      const [resOrder] = await conn.query<ResultSetHeader>(
        "UPDATE pedido SET horaEntrega = ? , domicilio = ?, observacion = ? WHERE id = ?",
        [horaEntrega, domicilio, observacion, orderId]
      );

      const [resCustomerPay] = await conn.query<ResultSetHeader>(
        "UPDATE pagocliente SET fechaPago = ?, metodoPago = ? WHERE pedido_id = ?",
        [fechaPago, metodoPago, orderId]
      );

      if (resOrder.affectedRows === 0) {
        throw new NotFoundError("Pedido no encontrado");
      }

      if (resCustomerPay.affectedRows === 0) {
        throw new NotFoundError("Pago del cliente no encontrado");
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
        "DELETE FROM pedido WHERE id = ?",
        [orderId]
      );
      if (result.affectedRows === 0) {
        throw new NotFoundError("El pedido no existe");
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

  static async orderDelivered(orderId: number) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      const [res] = await conn.query<ResultSetHeader>(
        "UPDATE pedido SET entregado = 1 WHERE id = ?",
        [orderId]
      );
      if (res.affectedRows === 0) {
        throw new BadRequestError("Error al dar como entregado el pedido");
      }
      await conn.commit();
      return res;
    } catch (error) {
      await conn.rollback();
    } finally {
      conn.release();
    }
  }
}
