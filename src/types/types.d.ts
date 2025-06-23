import { RowDataPacket } from "../../node_modules/mysql2/promise";

type State = "pendiente" | "entregado" | "listo" | "cancelado";
type PayMethod = "transferencia" | "efectivo" | null;
export type CompleteOrderDetail = {
  id: number;
  productName: string;
  cantidad: number;
  estado: State;
  metodoPago: PayMethod;
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

export type Product = {
  nombre: string;
  cantidad: number;
};
export type GetAllOrders = {
  id: number;
  nombreCliente: string;
  apellidoCliente: string;
  monto: number;
  fechaPago: Date | null;
  observacion: string;
  domicilio: string;
  estado: State;
  horaEntrega: string | null;
  productos: {
    [categoria: string]: Product[];
  };
} & RowDataPacket;

export type UpdateOrder = {
  horaEntrega: string | null;
  domicilio: string;
  observacion: string | null;
  fechaPago: Date | null;
  monto: number;
  metodoPago: PayMethod;
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
  metodoPago: PayMethod;
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

export type UserRole = "admin" | "client" | "none";

export type Payload = {
  email: string;
  role: string;
};
export type CustomerQuery = Customer & RowDataPacket;

export interface CustomError extends Error {
  statusCode?: number;
}
