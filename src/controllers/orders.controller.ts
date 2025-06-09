import { NextFunction, Request, Response } from "express";
import { OrderService } from "../services/orders.service";

export async function getOrders(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const orders = await OrderService.getOrders();
    res.status(200).json(orders);
  } catch (error) {
    next(error);
  }
}

export async function getOrdersToday(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const orders = await OrderService.getOrdersToday();
    res.status(200).json(orders);
  } catch (error) {
    next(error);
  }
}

export async function getOrderDetail(req: Request, res: Response) {
  try {
    const { oid } = req.params;

    if (!oid) {
      res.status(400).json({ message: "ID de pedido es requerido" });
      return;
    }
    const orderDetail = await OrderService.getOrderDetail(parseInt(oid));
    res.status(200).json(orderDetail);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al obtener el detalle del pedido", error });
  }
}

export async function createOrder(req: Request, res: Response) {
  try {
    const { productos, domicilio, horaEntrega, cliente, observacion } =
      req.body;
    const products = productos.map(
      (p: { productoId: number; cantidad: number }) => ({
        productId: p.productoId,
        quantity: p.cantidad,
      })
    );
    await OrderService.createOrder(
      products,
      domicilio,
      horaEntrega,
      observacion,
      cliente
    );
    res.status(201).json({ message: "Pedido creado con éxito." });
  } catch (error) {
    res.status(500).json({ message: "Error al crear el pedido", error });
  }
}

export async function addProductToOrder(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { productId, orderId, quantity } = req.body;

  try {
    await OrderService.addProductToOrder(orderId, productId, quantity);
    res.status(200).json({ message: "Producto agregado al pedido con exito" });
  } catch (error) {
    next(error);
  }
}

export async function payOrder(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { pedidoId, monto, metodoPago } = req.body;

    await OrderService.payOrder(pedidoId, metodoPago, monto);
    res.status(200).json({ message: "Pedido pagado con exito" });
  } catch (error) {
    next(error);
  }
}

export async function deleteProductFromOrder(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { oid, pid } = req.params;
  try {
    const productDeleted = await OrderService.deleteProductFromOrder(
      parseInt(oid),
      parseInt(pid)
    );
    if (productDeleted === 0) {
      res.status(404).json({ message: "Producto no encontrado en el pedido" });
    }
    res.status(200).json({ message: "Producto eliminado del pedido" });
  } catch (error) {
    next(error);
  }
}

export async function updateProductQuantity(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { oid, pid } = req.params;
  const { quantity } = req.body;
  if (!oid || !pid || quantity === null) {
    res.status(400).json({ message: "Faltan datos requeridos." });
    return;
  }
  try {
    await OrderService.updateProductQuantity(
      parseInt(oid),
      parseInt(pid),
      parseInt(quantity)
    );

    res.status(200).json({ message: "Cantidad actualizada correctamente" });
  } catch (error) {
    next(error);
  }
}

export async function updateOrder(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { oid } = req.params;
  console.log("REQ.BODY", req.body);
  const { pedido } = req.body;

  try {
    if (!pedido) {
      res
        .status(400)
        .json({ message: "Datos incompletos para actualizar el pedido." });
      return;
    }
    await OrderService.updateOrder(oid, pedido);
    res.status(200).json({ message: "Pedido actualizado correctamente" });
  } catch (error) {
    next(error);
  }
}

export async function deleteOrder(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { oid } = req.params;
  try {
    if (!oid) {
      res.status(400).json({ message: "Error no existe un pedido con ese ID" });
      return;
    }

    await OrderService.deleteOrder(parseInt(oid));
    res.status(200).json({ message: "Pedido eliminado correctamente" });
  } catch (error) {
    next(error);
  }
}
