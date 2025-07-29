import { NextFunction, Request, Response } from "express";
import { OrderService } from "../services/orders.service";

export async function getOrders(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const filter = (req.query.filter as string) || null;
    console.log(filter);
    const limit = parseInt(req.query.limit as string) || 10;
    const page = parseInt(req.query.page as string) || 1;
    const offset = (page - 1) * limit;
    const { data, total } = await OrderService.getOrders(filter, limit, offset);
    res.status(200).json({
      data,
      pagination: {
        currentPage: page,
        totalItems: total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getOrderById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { oid } = req.params;

    if (!oid) {
      res.status(400).json({ message: "ID de pedido es requerido" });
      return;
    }
    const data = await OrderService.getOrderById(parseInt(oid));
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}

export async function createOrder(req: Request, res: Response) {
  try {
    const {
      nombre_cliente,
      apellido_cliente,
      telefono_cliente,
      domicilio,
      hora_entrega,
      observacion,
      productos,
      monto,
      metodo_pago,
    } = req.body;

    await OrderService.createOrder(
      nombre_cliente,
      apellido_cliente,
      telefono_cliente,
      domicilio,
      hora_entrega,
      observacion,
      productos,
      metodo_pago,
      monto
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
  const { producto_id, pedido_id, cantidad } = req.body;

  try {
    await OrderService.addProductToOrder(pedido_id, producto_id, cantidad);
    res.status(200).json({ message: "Producto agregado al pedido con exito" });
  } catch (error) {
    next(error);
  }
}

export async function insertOrderPayments(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { pedido_id, monto, metodo_pago } = req.body;

    await OrderService.insertOrderPayments(pedido_id, metodo_pago, monto);
    res.status(200).json({ message: "Pedido pagado con exito" });
  } catch (error) {
    next(error);
  }
}

export async function insertPayDate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { oid } = req.params;
    const { date } = req.body;

    await OrderService.insertDatePay(parseInt(oid), date);
    res.status(200).json({ message: "Fecha de pago insertada con exito" });
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
    await OrderService.deleteProductFromOrder(parseInt(oid), parseInt(pid));

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
  const { cantidad } = req.body;
  if (!oid || !pid || cantidad === null) {
    res.status(400).json({ message: "Faltan datos requeridos." });
    return;
  }
  try {
    await OrderService.updateProductQuantity(
      parseInt(oid),
      parseInt(pid),
      parseInt(cantidad)
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
  const {
    domicilio,
    hora_entrega,
    metodo_pago,
    observacion,
    estado,
    productos,
    monto,
  } = req.body;

  try {
    if (!oid) {
      res.status(400).json({ message: "Id no existente." });
      return;
    }
    await OrderService.updateOrder(
      oid,
      domicilio,
      hora_entrega,
      observacion,
      estado,
      metodo_pago,
      monto,
      productos
    );
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
