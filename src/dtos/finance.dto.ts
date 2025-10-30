export interface AmountResponseDTO {
  total: number;
}

export interface FinanceParamResponseDTO {
  valor: number;
}

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
