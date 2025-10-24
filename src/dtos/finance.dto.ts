// ==================== RESPONSE DTOs ====================

export interface AmountResponseDTO {
  monto_total: number;
}

export interface DeliveryAmountResponseDTO {
  total_a_pagar: number;
}

export interface FinanceParamResponseDTO {
  valor: number;
}

// ==================== REQUEST DTOs ====================

export interface MonthlyQueryParamsDTO {
  month: number;
  year: number;
}

export interface FinanceParamQueryDTO {
  paramName: string;
}

export interface UpdateFinanceParamRequestDTO {
  value: number;
  paramName: string;
}
