import { FinanceRepository } from '../repositories/finance.repository';

export class FinanceService {
  private static financeRepository = new FinanceRepository();

  static async getAmountToday() {
    return await this.financeRepository.getAmountToday();
  }

  static async getTransferAmountToday() {
    return await this.financeRepository.getTransferAmountToday();
  }

  static async getCashAmountToday() {
    return await this.financeRepository.getCashAmountToday();
  }

  static async getAmountMonthly(month: number, year: number) {
    return await this.financeRepository.getAmountMonthly(month, year);
  }

  static async getTransferAmountMonthly(month: number, year: number) {
    return await this.financeRepository.getTransferAmountMonthly(month, year);
  }

  static async getCashAmountMonthly(month: number, year: number) {
    return await this.financeRepository.getCashAmountMonthly(month, year);
  }

  static async getDeliveryAmountToPay() {
    return await this.financeRepository.getDeliveryAmountToPay();
  }

  static async getDeliveryCashAmount() {
    return await this.financeRepository.getDeliveryCashAmount();
  }

  static async getValueFinanceParam(paramName: string) {
    return await this.financeRepository.getFinanceParamValue(paramName);
  }

  static async updateValueFinanceParam(value: number, paramName: string) {
    await this.financeRepository.updateFinanceParamValue(value, paramName);
  }
}
