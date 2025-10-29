import { IFinanceRepository } from "../interfaces/finance.interface";

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

  async getValueFinanceParam(paramName: string) {
    return await this.financeRepository.getFinanceParamValue(paramName);
  }

  async updateValueFinanceParam(value: number, paramName: string) {
    await this.financeRepository.updateFinanceParamValue(value, paramName);
  }
}
