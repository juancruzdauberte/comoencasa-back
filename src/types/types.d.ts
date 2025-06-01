import { RowDataPacket } from "../../node_modules/mysql2/promise";

export type Category = {
  id?: number;
  name: string;
};

export type Product = {
  id?: number;
  name: string;
  price: number;
  category: number;
};

export type Customer = {
  id?: number;
  name: string;
  surname: string;
  phone: string;
  address: string;
};

export type Order = {
  id?: number;
  address: string;
  state: string;
  customer: number;
};

export type Supplier = {
  id?: number;
  name: string;
  phone: string;
  address: string;
};

export type CompleteOrderDetail = {
  nombre: string;
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
