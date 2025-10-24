import { NextFunction, Request, Response } from 'express';
import { OrderService } from '../services/orders.service';
import { ErrorFactory } from '../errors/errorFactory';
import {
  CreateOrderRequestDTO,
  OrderQueryParamsDTO,
  UpdateOrderRequestDTO,
} from '../dtos/order.dto';

export async function getOrders(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { filter, limit = 10, page = 1 } = req.query as unknown as OrderQueryParamsDTO;
    
    const parsedLimit = Number(limit);
    const parsedPage = Number(page);
    const offset = (parsedPage - 1) * parsedLimit;

    const { data, total } = await OrderService.getOrders(
      filter || null,
      parsedLimit,
      offset
    );

    res.status(200).json({
      data,
      pagination: {
        currentPage: parsedPage,
        totalItems: total,
        totalPages: Math.ceil(total / parsedLimit),
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
      throw ErrorFactory.badRequest('ID de pedido es requerido');
    }

    const data = await OrderService.getOrderById(parseInt(oid));
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}

export async function createOrder(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const {
      domicilio,
      hora_entrega,
      observacion = '',
      productos,
      monto,
      metodo_pago,
    } = req.body as CreateOrderRequestDTO;

    await OrderService.createOrder(
      domicilio,
      hora_entrega,
      observacion,
      productos,
      metodo_pago,
      monto
    );

    res.status(201).json({ message: 'Pedido creado con éxito.' });
  } catch (error) {
    next(error);
  }
}

export async function addProductToOrder(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { producto_id, pedido_id, cantidad } = req.body;

    if (!producto_id || !pedido_id || !cantidad) {
      throw ErrorFactory.badRequest('Faltan datos requeridos');
    }

    await OrderService.addProductToOrder(
      Number(pedido_id),
      Number(producto_id),
      Number(cantidad)
    );

    res.status(200).json({ message: 'Producto agregado al pedido con éxito' });
  } catch (error) {
    next(error);
  }
}

export async function insertOrderDatePay(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { oid } = req.params;

    const orderId = Number(oid);
    if (!orderId || isNaN(orderId)) {
      throw ErrorFactory.badRequest('ID de pedido inválido');
    }

    await OrderService.insertOrderDatePay(orderId);
    res.status(200).json({ message: 'Pedido pagado con éxito' });
  } catch (error) {
    next(error);
  }
}

export async function deleteProductFromOrder(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { oid, pid } = req.params;

    if (!oid || !pid) {
      throw ErrorFactory.badRequest('Faltan parámetros requeridos');
    }

    await OrderService.deleteProductFromOrder(
      parseInt(oid),
      parseInt(pid)
    );

    res.status(200).json({ message: 'Producto eliminado del pedido' });
  } catch (error) {
    next(error);
  }
}

export async function updateProductQuantity(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { oid, pid } = req.params;
    const { cantidad } = req.body;

    if (!oid || !pid || cantidad === undefined || cantidad === null) {
      throw ErrorFactory.badRequest('Faltan datos requeridos');
    }

    await OrderService.updateProductQuantity(
      parseInt(oid),
      parseInt(pid),
      parseInt(cantidad)
    );

    res.status(200).json({ message: 'Cantidad actualizada correctamente' });
  } catch (error) {
    next(error);
  }
}

export async function updateOrder(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { oid } = req.params;

    if (!oid) {
      throw ErrorFactory.badRequest('ID de pedido no existente');
    }

    const {
      domicilio,
      hora_entrega,
      metodo_pago,
      observacion,
      estado,
      productos,
      monto,
    } = req.body as UpdateOrderRequestDTO;

    await OrderService.updateOrder(
      oid,
      domicilio!,
      hora_entrega!,
      observacion!,
      estado!,
      metodo_pago!,
      monto!,
      productos!
    );

    res.status(200).json({ message: 'Pedido actualizado correctamente' });
  } catch (error) {
    next(error);
  }
}

export async function deleteOrder(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { oid } = req.params;

    if (!oid) {
      throw ErrorFactory.badRequest('Error: no existe un pedido con ese ID');
    }

    await OrderService.deleteOrder(parseInt(oid));
    res.status(200).json({ message: 'Pedido eliminado correctamente' });
  } catch (error) {
    next(error);
  }
}
