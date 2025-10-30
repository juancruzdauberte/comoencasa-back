import { PoolConnection } from "mysql2/typings/mysql/lib/PoolConnection";
import { ErrorFactory } from "../errors/errorFactory";
import { IFinanceRepository } from "../interfaces/finance.interface";
import { withTransaction } from "../utils/database.utils";
import { secureLogger } from "../config/logger";
import { AppError } from "../errors/errors";

export class FinanceService {
  constructor(private financeRepository: IFinanceRepository) {}

  async getAmountToday() {
    return await this.financeRepository.getAmountToday();
  }

  async getTransferAmountToday() {
    return await this.financeRepository.getTransferAmountToday();
  }

  async getCashAmountToday() {
    return await this.financeRepository.getCashAmountToday();
  }

  async getAmountMonthly(month: number, year: number) {
    return await this.financeRepository.getAmountMonthly(month, year);
  }

  async getTransferAmountMonthly(month: number, year: number) {
    return await this.financeRepository.getTransferAmountMonthly(month, year);
  }

  async getCashAmountMonthly(month: number, year: number) {
    return await this.financeRepository.getCashAmountMonthly(month, year);
  }

  async getDeliveryAmountToPay() {
    return await this.financeRepository.getDeliveryAmountToPay();
  }

  async getDeliveryCashAmount() {
    return await this.financeRepository.getDeliveryCashAmount();
  }

  // --- Lógica de Negocio Añadida ---

  async getValueFinanceParam(paramName: string) {
    // El repositorio devuelve 'null' si no lo encuentra
    const param = await this.financeRepository.getFinanceParamValue(paramName);

    // El servicio aplica la regla de negocio: si es 'null', es un 404.
    if (!param) {
      throw ErrorFactory.notFound(
        `Parámetro financiero '${paramName}' no encontrado`
      );
    }

    return param;
  }

  async updateValueFinanceParam(value: number, paramName: string) {
    try {
      await withTransaction(async (conn) => {
        const result = await this.financeRepository.updateFinanceParamValue(
          value,
          paramName,
          conn
        );

        // El servicio comprueba el resultado (lógica de negocio)
        if (result.affectedRows === 0) {
          throw ErrorFactory.notFound(
            `Parámetro financiero '${paramName}' no encontrado para actualizar`
          );
        }

        secureLogger.info("Finance param updated successfully", {
          paramName,
          value,
        });
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      secureLogger.error("Error updating finance param", error, {
        paramName,
        value,
      });
      throw ErrorFactory.internal(
        "Error al actualizar el parámetro financiero"
      );
    }
  }
}
