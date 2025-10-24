// Este archivo mantiene tipos legacy para compatibilidad
// Los nuevos desarrollos deben usar los DTOs en /dtos

import { OrderResponseDTO, OrderStatus, PaymentMethod } from '../dtos/order.dto';

// Re-exportar tipos principales para compatibilidad
export type GetPedidosResponse = {
  data: OrderResponseDTO[];
  total: number;
};

export type Pedido = OrderResponseDTO;

export type ProductoInput = {
  producto_id: number;
  cantidad: number;
};

// Tipos de utilidad
export interface CustomError extends Error {
  statusCode?: number;
}
