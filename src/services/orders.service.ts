import { OrderRepository } from "../repositories/order.repository";
import { ProductCreateOrderDTO } from "../dtos/order.dto";
import { ErrorFactory } from "../errors/errorFactory";

export class OrderService {
  private static orderRepository = new OrderRepository();

  static async getOrders(filter: string | null, limit: number, offset: number) {
    return await this.orderRepository.findAll(filter, limit, offset);
  }

  static async getOrderById(orderId: number) {
    const order = await this.orderRepository.findById(orderId);

    if (!order) {
      throw ErrorFactory.notFound(`Pedido con ID ${orderId} no encontrado`);
    }

    return order;
  }

  static async createOrder(
    address: string,
    deliveryTime: string,
    observation: string,
    products: ProductCreateOrderDTO[],
    payMethod: string,
    amount: number
  ) {
    // Validaciones previas
    if (!products || products.length === 0) {
      throw ErrorFactory.badRequest("Debe incluir al menos un producto");
    }

    // Validar todos los productos antes de iniciar transacción
    const invalidProducts = products.filter(
      (p) => !Number.isInteger(p.cantidad) || p.cantidad <= 0
    );

    if (invalidProducts.length > 0) {
      const ids = invalidProducts.map((p) => p.producto_id).join(", ");
      throw ErrorFactory.badRequest(
        `Productos con cantidades inválidas: ${ids}`
      );
    }

    // Validar que todos los productos existen
    for (const product of products) {
      const exists = await this.orderRepository.productExists(
        product.producto_id
      );
      if (!exists) {
        throw ErrorFactory.notFound(
          `Producto con ID ${product.producto_id} no existe`
        );
      }
    }

    return await this.orderRepository.create(
      address,
      deliveryTime,
      observation,
      products,
      payMethod,
      amount
    );
  }

  static async addProductToOrder(
    orderId: number,
    productId: number,
    quantity: number
  ) {
    // Validar cantidad
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw ErrorFactory.badRequest(
        "La cantidad debe ser un número mayor a cero."
      );
    }

    // Verificar que el pedido existe
    const orderExists = await this.orderRepository.orderExists(orderId);
    if (!orderExists) {
      throw ErrorFactory.notFound(`Pedido con ID ${orderId} no existe`);
    }

    // Verificar que el producto existe
    const productExists = await this.orderRepository.productExists(productId);
    if (!productExists) {
      throw ErrorFactory.notFound(`Producto con ID ${productId} no existe`);
    }

    await this.orderRepository.addProduct(orderId, productId, quantity);
  }

  static async insertOrderDatePay(orderId: number) {
    const orderExists = await this.orderRepository.orderExists(orderId);
    if (!orderExists) {
      throw ErrorFactory.notFound(`Pedido con ID ${orderId} no existe`);
    }

    await this.orderRepository.insertPaymentDate(orderId);
  }

  static async deleteProductFromOrder(orderId: number, productId: number) {
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

    await this.orderRepository.deleteProduct(orderId, productId);
  }

  static async updateProductQuantity(
    orderId: number,
    productId: number,
    quantity: number
  ) {
    // Validar cantidad
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw ErrorFactory.badRequest("La cantidad debe ser mayor a cero");
    }

    const orderExists = await this.orderRepository.orderExists(orderId);
    if (!orderExists) {
      throw ErrorFactory.notFound(`Pedido con ID ${orderId} no existe`);
    }

    // Verificar que el producto existe en el pedido
    const productExistsInOrder =
      await this.orderRepository.productExistsInOrder(orderId, productId);
    if (!productExistsInOrder) {
      throw ErrorFactory.notFound(
        `Producto ${productId} no encontrado en pedido ${orderId}`
      );
    }

    await this.orderRepository.updateProductQuantity(
      orderId,
      productId,
      quantity
    );
  }

  static async updateOrder(
    orderId: string,
    address: string,
    deliveryTime: string,
    observation: string,
    state: string,
    payMethod: string,
    amount: number,
    products: ProductCreateOrderDTO[]
  ) {
    // Validar existencia del pedido
    const orderExists = await this.orderRepository.orderExists(Number(orderId));
    if (!orderExists) {
      throw ErrorFactory.notFound(`Pedido con ID ${orderId} no existe`);
    }

    // Validar todos los productos antes de actualizar
    for (const product of products) {
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

      // Validar que el producto existe
      const productExists = await this.orderRepository.productExists(
        product.producto_id
      );
      if (!productExists) {
        throw ErrorFactory.notFound(
          `Producto con ID ${product.producto_id} no existe`
        );
      }
    }

    await this.orderRepository.update(
      orderId,
      address,
      deliveryTime,
      observation,
      state,
      payMethod,
      amount,
      products
    );
  }

  static async deleteOrder(orderId: number) {
    const orderExists = await this.orderRepository.orderExists(orderId);
    if (!orderExists) {
      throw ErrorFactory.notFound(`Pedido con ID ${orderId} no existe`);
    }

    await this.orderRepository.delete(orderId);
  }
}
