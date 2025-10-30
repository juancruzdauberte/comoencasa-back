import {
  AmountResponseDTO,
  FinanceParamResponseDTO,
} from "../dtos/finance.dto";
import { IBaseRepository } from "./repository.interface";

export interface IFinanceRepository extends IBaseRepository {
  getAmountToday(): Promise<AmountResponseDTO>;

  getTransferAmountToday(): Promise<AmountResponseDTO>;

  getCashAmountToday(): Promise<AmountResponseDTO>;

  getAmountMonthly(month: number, year: number): Promise<AmountResponseDTO>;

  getTransferAmountMonthly(
    month: number,
    year: number
  ): Promise<AmountResponseDTO>;

  getCashAmountMonthly(month: number, year: number): Promise<AmountResponseDTO>;

  getDeliveryAmountToPay(): Promise<AmountResponseDTO>;

  getDeliveryCashAmount(): Promise<AmountResponseDTO>;

  getFinanceParamValue(paramName: string): Promise<FinanceParamResponseDTO>;

  updateFinanceParamValue(value: number, paramName: string): Promise<void>;
}
