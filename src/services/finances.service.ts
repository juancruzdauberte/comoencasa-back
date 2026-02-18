import { ErrorFactory } from "../errors/errorFactory";
import { IFinanceRepository } from "../interfaces/finance.interface";
import { withTransaction } from "../utils/database.utils";
import { secureLogger } from "../config/logger";
import { AppError } from "../errors/errors";
import { redisClient, safeGet, safeSet } from "../config/redis.config";

export class FinanceService {
  constructor(private financeRepository: IFinanceRepository) {}

  async getAmountToday() {
    const cacheKey = "finance:amount:today";
    const cached = await safeGet(cacheKey);
    if (cached) return JSON.parse(cached);

    const amount = await this.financeRepository.getAmountToday();
    await safeSet(cacheKey, JSON.stringify(amount), { EX: 600 });
    return amount;
  }

  async getTransferAmountToday() {
    const cacheKey = "finance:transfer:today";
    const cached = await safeGet(cacheKey);
    if (cached) return JSON.parse(cached);

    const amount = await this.financeRepository.getTransferAmountToday();
    await safeSet(cacheKey, JSON.stringify(amount), { EX: 600 });
    return amount;
  }

  async getCashAmountToday() {
    const cacheKey = "finance:cash:today";
    const cached = await safeGet(cacheKey);
    if (cached) return JSON.parse(cached);

    const amount = await this.financeRepository.getCashAmountToday();
    await safeSet(cacheKey, JSON.stringify(amount), { EX: 600 });
    return amount;
  }

  async getAmountMonthly(month: number, year: number) {
    const cacheKey = `finance:amount:monthly:${year}:${month}`;
    const cached = await safeGet(cacheKey);
    if (cached) return JSON.parse(cached);

    const amount = await this.financeRepository.getAmountMonthly(month, year);
    await safeSet(cacheKey, JSON.stringify(amount), { EX: 600 });
    return amount;
  }

  async getTransferAmountMonthly(month: number, year: number) {
    const cacheKey = `finance:transfer:monthly:${year}:${month}`;
    const cached = await safeGet(cacheKey);
    if (cached) return JSON.parse(cached);

    const amount = await this.financeRepository.getTransferAmountMonthly(
      month,
      year,
    );
    await safeSet(cacheKey, JSON.stringify(amount), { EX: 600 });
    return amount;
  }

  async getCashAmountMonthly(month: number, year: number) {
    const cacheKey = `finance:cash:monthly:${year}:${month}`;
    const cached = await safeGet(cacheKey);
    if (cached) return JSON.parse(cached);

    const amount = await this.financeRepository.getCashAmountMonthly(
      month,
      year,
    );
    await safeSet(cacheKey, JSON.stringify(amount), { EX: 600 });
    return amount;
  }

  async getDeliveryAmountToPay() {
    const cacheKey = "finance:delivery:pay";
    const cached = await safeGet(cacheKey);
    if (cached) return JSON.parse(cached);

    const amount = await this.financeRepository.getDeliveryAmountToPay();
    await safeSet(cacheKey, JSON.stringify(amount), { EX: 600 });
    return amount;
  }

  async getDeliveryCashAmount() {
    const cacheKey = "finance:delivery:cash";
    const cached = await safeGet(cacheKey);
    if (cached) return JSON.parse(cached);

    const amount = await this.financeRepository.getDeliveryCashAmount();
    await safeSet(cacheKey, JSON.stringify(amount), { EX: 600 });
    return amount;
  }

  async getValueFinanceParam(paramName: string) {
    const param = await this.financeRepository.getFinanceParamValue(paramName);

    if (!param) {
      throw ErrorFactory.notFound(
        `Parámetro financiero '${paramName}' no encontrado`,
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
          conn,
        );
        if (result.affectedRows === 0) {
          throw ErrorFactory.notFound(
            `Parámetro financiero '${paramName}' no encontrado para actualizar`,
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
        "Error al actualizar el parámetro financiero",
      );
    }
  }
}
