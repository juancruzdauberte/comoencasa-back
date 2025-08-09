export type GetPedidosResponse = {
  data: Pedido[];
  total: number;
};

export type GetClientResponse = {
  nombre: string;
  apellido: string;
};

export type ProductoInput = {
  producto_id: number;
  cantidad?: number;
};

type ProductoPedido = {
  producto_id: number;
  nombre: string;
  cantidad: number;
  categoria: string;
};

export type Pedido = {
  id: number;
  domicilio: string;
  nombre_cliente: string;
  apellido_cliente: string;
  telefono_cliente: string;
  fecha_pedido: string;
  hora_entrega: string | null;
  estado: "preparando" | "listo" | "entregado" | "cancelado";
  monto_pago: number | null;
  fecha_pago: string | null;
  metodo_pago: "efectivo" | "transferencia" | null;
  observacion: string | null;
  productos: ProductoPedido[];
};

export type UserRole = "admin" | "client" | "none";

export type Payload = {
  email: string;
  rol: string;
  avatar: string;
};

export interface CustomError extends Error {
  statusCode?: number;
}

export type User = {
  id: number;
  rol: "admin" | "user";
  email: string;
};
