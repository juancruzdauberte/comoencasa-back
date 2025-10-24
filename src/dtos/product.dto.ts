// ==================== REQUEST DTOs ====================

export interface CreateProductRequestDTO {
  nombre: string;
  categoria_id: number;
}

export interface CreateCategoryRequestDTO {
  nombre: string;
}

export interface ProductQueryParamsDTO {
  category?: string;
}

// ==================== RESPONSE DTOs ====================

export interface ProductResponseDTO {
  id: number;
  nombre: string;
  categoriaId: number;
  categoria: string;
}

export interface CategoryResponseDTO {
  id: number;
  nombre: string;
}

export interface ProductsByCategoryResponseDTO {
  id: number;
  nombre: string;
  categoria: string;
}

// ==================== INTERNAL DTOs ====================

export interface ProductCreateOrderDTO {
  producto_id: number;
  cantidad: number;
}
