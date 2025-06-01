import { Request, Response } from "express";
import { OrderService } from "../services/orders.service";

export async function getOrders(req: Request, res: Response) {
  try {
    const orders = await OrderService.getOrders();
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener los pedidos", error });
  }
}

export async function getOrderDetail(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ message: "ID de pedido es requerido" });
      return;
    }
    const orderDetail = await OrderService.getOrderDetail(parseInt(id));
    res.status(200).json(orderDetail);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al obtener el detalle del pedido", error });
  }
}

export async function createOrder(req: Request, res: Response) {
  const { products, address, deliveryTime, clientId } = req.body;
  try {
    await OrderService.createOrder(products, address, deliveryTime, clientId);
    res.status(201).json({ message: "Pedido creado con éxito." });
  } catch (error) {
    res.status(500).json({ message: "Error al crear el pedido", error });
  }
}

export async function addProductToOrder(req: Request, res: Response) {
  const { productId, orderId, quantity } = req.body;

  if (!orderId || !productId || !quantity) {
    res.status(400).json({ error: "Faltan datos obligatorios." });
    return;
  }
  try {
    await OrderService.addProductToOrder(orderId, productId, quantity);
    res.status(200).json({ message: "Producto agregado al pedido con exito" });
  } catch (error) {
    res.status(500).json({
      message: "Error en el servidor al agregar producto al pedido",
      error,
    });
  }
}

export async function payOrder(req: Request, res: Response) {
  try {
    const { orderId, monto, metodo } = req.body;

    if (!orderId || !monto || !metodo) {
      res.status(400).json({ error: "Faltan datos obligatorios." });
      return;
    }

    await OrderService.payOrder(orderId, metodo, monto);
    res.status(200).json({ message: "Pedido pagado con exito" });
  } catch (error) {
    res.status(500).json({ message: "Error al pagar el pedido", error });
  }
}
