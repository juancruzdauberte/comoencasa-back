import { RowDataPacket } from "../../node_modules/mysql2/promise";

export type CompleteOrderDetail = {
  productName: string;
  cantidad: number;
  estado: string;
  metodoPago: string | null;
  domicilio: string;
  horaEntrega: string | null;
  fecha: Date;
  fechaPago: Date | null;
  monto: number | null;
  clienteNombre: string;
  clienteApellido: string;
  clienteTelefono: string;
  categoria: string;
  observacion: string | null;
} & RowDataPacket;

export type GetAllOrders = {
  id: number;
  nombreCliente: string;
  apellidoCliente: string;
  monto: number;
  fechaPago: Date | null;
  domicilio: string;
  horaEntrega: string | null;
} & RowDataPacket;

export type UpdateOrder = {
  pedido: {
    horaEntrega: string | null;
    domicilio: string;
    observacion: string | null;
  };
  pagoCliente: {
    fechaPago: Date | null;
    metodoPago: string;
  };
};

export type OrderDetail = {
  producto_id: number;
  cantidad: number;
  pedido_id: number;
} & RowDataPacket;

export type GetOrderId = {
  id: string;
} & RowDataPacket;

export type PayOrder = {
  pedido_id: number;
  metodoPago: string;
  monto: number;
  fechaPago: Date | null;
} & RowDataPacket;

export type GetProductId = {
  id: string;
} & RowDataPacket;

export type Customer = {
  id: number;
  nombre: string;
  apellido: string;
  telefono: string;
};

export type CustomerQuery = Customer & RowDataPacket;

export interface CustomError extends Error {
  statusCode?: number;
}
