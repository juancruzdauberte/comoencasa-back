// ==================== REQUEST DTOs ====================

export interface CreateOrderRequestDTO {
  domicilio: string;
  hora_entrega: string;
  apellido_cliente?: string;
  observacion?: string;
  productos: ProductCreateOrderDTO[];
  metodo_pago: "efectivo" | "transferencia";
  monto: number;
}

export interface UpdateOrderRequestDTO {
  domicilio?: string;
  hora_entrega?: string;
  observacion?: string;
  estado?: OrderStatus;
  metodo_pago?: PaymentMethod;
  monto?: number;
  productos?: ProductCreateOrderDTO[];
  apellido_cliente?: string;
}

export interface AddProductToOrderRequestDTO {
  pedido_id: number;
  producto_id: number;
  cantidad: number;
}

export interface UpdateProductQuantityRequestDTO {
  cantidad: number;
}

// ==================== RESPONSE DTOs ====================

export interface OrderResponseDTO {
  id: number;
  domicilio: string;
  fecha_pedido: string;
  hora_entrega: string | null;
  estado: OrderStatus;
  monto_pago: number | null;
  fecha_pago: string | null;
  metodo_pago: PaymentMethod | null;
  observacion: string | null;
  apellido_cliente: string | null;
  productos: OrderProductDTO[];
}

export interface OrderProductDTO {
  producto_id: number;
  nombre: string;
  cantidad: number;
  categoria: string;
}

export interface PaginatedOrdersResponseDTO {
  data: OrderResponseDTO[];
  pagination: PaginationDTO;
}

export interface PaginationDTO {
  currentPage: number;
  totalItems: number;
  totalPages: number;
}

// ==================== INTERNAL DTOs ====================

export interface ProductCreateOrderDTO {
  producto_id: number;
  cantidad: number;
}

// ==================== TYPES ====================

export type OrderStatus = "preparando" | "listo" | "entregado" | "cancelado";
export type PaymentMethod = "efectivo" | "transferencia";

// ==================== QUERY DTOs ====================

export interface OrderQueryParamsDTO {
  filter?: string;
  limit?: number;
  page?: number;
}
