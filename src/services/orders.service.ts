import { secureLogger } from "../config/logger";
import {
  CreateOrderRequestDTO,
  UpdateOrderRequestDTO,
} from "../dtos/order.dto";
import { ErrorFactory } from "../errors/errorFactory";
import { AppError } from "../errors/errors";
import { IOrderRepository } from "../interfaces/order.interface";
import { withTransaction } from "../utils/database.utils";

export class OrderService {
  constructor(private readonly orderRepository: IOrderRepository) {}

  async getOrders(filter: string | null, limit: number, offset: number) {
    return await this.orderRepository.findAll(filter, limit, offset);
  }

  async getOrderById(orderId: number) {
    const order = await this.orderRepository.findById(orderId);

    if (!order) {
      throw ErrorFactory.notFound(`Pedido con ID ${orderId} no encontrado`);
    }

    return order;
  }

  async createOrder(payload: CreateOrderRequestDTO) {
    const { productos } = payload;

    if (!productos || productos.length === 0) {
      throw ErrorFactory.badRequest("Debe incluir al menos un producto");
    }

    const invalidProducts = productos.filter(
      (p) => !Number.isInteger(p.cantidad) || p.cantidad <= 0
    );
    if (invalidProducts.length > 0) {
      const ids = invalidProducts.map((p) => p.producto_id).join(", ");
      throw ErrorFactory.badRequest(
        `Productos con cantidades inválidas: ${ids}`
      );
    }

    for (const product of productos) {
      const exists = await this.orderRepository.productExists(
        product.producto_id
      );
      if (!exists) {
        throw ErrorFactory.notFound(
          `Producto con ID ${product.producto_id} no existe`
        );
      }
    }

    try {
      const orderId = await withTransaction(async (conn) => {
        const newOrderId = await this.orderRepository.create(
          {
            address: payload.domicilio,
            deliveryTime: payload.hora_entrega,
            observation: payload.observacion!,
            clientSurname: payload.apellido_cliente!,
          },
          conn
        );
        await this.orderRepository.createOrderPayment(
          newOrderId,
          payload.metodo_pago,
          payload.monto,
          conn
        );

        await this.orderRepository.createOrderDetails(
          newOrderId,
          payload.productos,
          conn
        );

        secureLogger.info("Order created successfully", {
          orderId: newOrderId,
          productsCount: productos.length,
        });

        return newOrderId;
      });

      return orderId;
    } catch (error) {
      secureLogger.error("Error creating order", error, { payload });
      throw ErrorFactory.internal("Error al crear el pedido");
    }
  }

  async addProductToOrder(
    orderId: number,
    productId: number,
    quantity: number
  ) {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw ErrorFactory.badRequest(
        "La cantidad debe ser un número mayor a cero."
      );
    }
    const orderExists = await this.orderRepository.orderExists(orderId);
    if (!orderExists) {
      throw ErrorFactory.notFound(`Pedido con ID ${orderId} no existe`);
    }
    const productExists = await this.orderRepository.productExists(productId);
    if (!productExists) {
      throw ErrorFactory.notFound(`Producto con ID ${productId} no existe`);
    }
    const productInOrder = await this.orderRepository.productExistsInOrder(
      orderId,
      productId
    );
    if (productInOrder) {
      throw ErrorFactory.badRequest(
        `Producto ${productId} ya existe en el pedido ${orderId}`
      );
    }
    try {
      await withTransaction(async (conn) => {
        await this.orderRepository.addProduct(
          orderId,
          productId,
          quantity,
          conn
        );
      });
      secureLogger.info("Product added to order", { orderId, productId });
    } catch (error) {
      secureLogger.error("Error adding product to order", error, {
        orderId,
        productId,
      });
      throw ErrorFactory.internal("Error al añadir producto al pedido");
    }
  }

  async insertOrderDatePay(orderId: number) {
    const orderExists = await this.orderRepository.orderExists(orderId);
    if (!orderExists) {
      throw ErrorFactory.notFound(`Pedido con ID ${orderId} no existe`);
    }
    try {
      await withTransaction(async (conn) => {
        const res = await this.orderRepository.insertPaymentDate(orderId, conn);

        if (res.affectedRows === 0) {
          throw ErrorFactory.badRequest(
            "El pedido ya tiene una fecha de pago o no se encontró el pago."
          );
        }
      });
      secureLogger.info("Payment date inserted for order", { orderId });
    } catch (error) {
      if (error instanceof AppError) throw error;
      secureLogger.error("Error inserting payment date", error, { orderId });
      throw ErrorFactory.internal("Error al insertar la fecha de pago");
    }
  }

  async deleteProductFromOrder(orderId: number, productId: number) {
    const orderExists = await this.orderRepository.orderExists(orderId);
    if (!orderExists) {
      throw ErrorFactory.notFound(`Pedido con ID ${orderId} no existe`);
    }
    const productExistsInOrder =
      await this.orderRepository.productExistsInOrder(orderId, productId);
    if (!productExistsInOrder) {
      throw ErrorFactory.notFound(
        `Producto ${productId} no encontrado en pedido ${orderId}`
      );
    }

    try {
      await withTransaction(async (conn) => {
        await this.orderRepository.deleteProduct(orderId, productId, conn);
      });
      secureLogger.info("Product removed from order", { orderId, productId });
    } catch (error) {
      secureLogger.error("Error removing product from order", error, {
        orderId,
        productId,
      });
      throw ErrorFactory.internal("Error al eliminar producto del pedido");
    }
  }

  async updateProductQuantity(
    orderId: number,
    productId: number,
    quantity: number
  ) {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw ErrorFactory.badRequest("La cantidad debe ser mayor a cero");
    }
    const orderExists = await this.orderRepository.orderExists(orderId);
    if (!orderExists) {
      throw ErrorFactory.notFound(`Pedido con ID ${orderId} no existe`);
    }
    const productExistsInOrder =
      await this.orderRepository.productExistsInOrder(orderId, productId);
    if (!productExistsInOrder) {
      throw ErrorFactory.notFound(
        `Producto ${productId} no encontrado en pedido ${orderId}`
      );
    }

    try {
      await withTransaction(async (conn) => {
        await this.orderRepository.updateProductQuantity(
          orderId,
          productId,
          quantity,
          conn
        );
      });
      secureLogger.info("Product quantity updated", {
        orderId,
        productId,
        quantity,
      });
    } catch (error) {
      secureLogger.error("Error updating product quantity", error, {
        orderId,
        productId,
      });
      throw ErrorFactory.internal("Error al actualizar cantidad del producto");
    }
  }

  async updateOrder(orderId: number, payload: UpdateOrderRequestDTO) {
    const orderExists = await this.orderRepository.orderExists(Number(orderId));
    if (!orderExists) {
      throw ErrorFactory.notFound(`Pedido con ID ${orderId} no existe`);
    }
    for (const product of payload.productos!) {
      if (!Number.isInteger(product.producto_id) || product.producto_id <= 0) {
        throw ErrorFactory.badRequest(
          `ID de producto inválido: ${product.producto_id}`
        );
      }
      if (!Number.isInteger(product.cantidad) || product.cantidad <= 0) {
        throw ErrorFactory.badRequest(
          `Cantidad inválida para producto ${product.producto_id}: ${product.cantidad}`
        );
      }
      const productExists = await this.orderRepository.productExists(
        product.producto_id
      );
      if (!productExists) {
        throw ErrorFactory.notFound(
          `Producto con ID ${product.producto_id} no existe`
        );
      }
    }

    try {
      await withTransaction(async (conn) => {
        await this.orderRepository.update(
          orderId,
          {
            address: payload.domicilio,
            deliveryTime: payload.hora_entrega,
            observation: payload.observacion,
            state: payload.estado,
            clientSurname: payload.apellido_cliente,
          },
          conn
        );
        await this.orderRepository.updateOrderPayment(
          orderId,
          payload.metodo_pago,
          payload.monto,
          conn
        );

        for (const product of payload.productos) {
          await this.orderRepository.updateProductQuantity(
            Number(orderId),
            product.producto_id,
            product.cantidad,
            conn
          );
        }
      });

      secureLogger.info("Order updated successfully", {
        orderId,
        productsCount: payload.productos.length,
      });
    } catch (error) {
      secureLogger.error("Error updating order", error, { orderId, payload });
      throw ErrorFactory.internal("Error al actualizar el pedido");
    }
  }

  async deleteOrder(orderId: number) {
    const orderExists = await this.orderRepository.orderExists(orderId);
    if (!orderExists) {
      throw ErrorFactory.notFound(`Pedido con ID ${orderId} no existe`);
    }
    try {
      await withTransaction(async (conn) => {
        const res = await this.orderRepository.delete(orderId, conn);

        if (res.affectedRows === 0) {
          throw ErrorFactory.notFound(`Pedido con ID ${orderId} no existe`);
        }
      });
      secureLogger.info("Order deleted successfully", { orderId });
    } catch (error) {
      if (error instanceof AppError) throw error;
      secureLogger.error("Error deleting order", error, { orderId });
      throw ErrorFactory.internal("Error al eliminar el pedido");
    }
  }
}
