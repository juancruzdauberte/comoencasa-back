import { PoolConnection } from "mysql2/promise";
import {
  AmountResponseDTO,
  FinanceParamResponseDTO,
} from "../dtos/finance.dto";
import { IBaseRepository } from "./repository.interface";
import { ResultSetHeader } from "mysql2";

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

  getFinanceParamValue(
    paramName: string
  ): Promise<FinanceParamResponseDTO | null>;

  updateFinanceParamValue(
    value: number,
    paramName: string,
    conn: PoolConnection
  ): Promise<ResultSetHeader>;
}
