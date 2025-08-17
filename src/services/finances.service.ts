import { db } from "../db/db";
import { ErrorFactory } from "../errors/errorFactory";
import { AppError } from "../errors/errors";

export class FinanceClass {
  static async getAmountToday() {
    try {
      const [res]: any = await db.query("CALL obtener_monto_total_hoy ()");
      return res[0][0];
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw ErrorFactory.internal("Error inesperado del sistema");
    }
  }

  static async getTransferAmountToday() {
    try {
      const [res]: any = await db.query(
        "CALL obtener_monto_total_hoy_trans ()"
      );
      return res[0][0];
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw ErrorFactory.internal("Error inesperado del sistema");
    }
  }

  static async getCashAmountToday() {
    try {
      const [res]: any = await db.query("CALL obtener_monto_total_hoy_efec ()");
      return res[0][0];
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw ErrorFactory.internal("Error inesperado del sistema");
    }
  }

  static async getAmountMonthly(month: number, year: number) {
    try {
      const [res]: any = await db.query("CALL obtener_monto_total_mes (?, ?)", [
        month,
        year,
      ]);
      return res[0][0];
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw ErrorFactory.internal("Error inesperado del sistema");
    }
  }

  static async getTransferAmountMonthly(month: number, year: number) {
    try {
      const [res]: any = await db.query(
        "CALL obtener_monto_total_mes_trans (?, ?)",
        [month, year]
      );
      return res[0][0];
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw ErrorFactory.internal("Error inesperado del sistema");
    }
  }

  static async getCashAmountMonthly(month: number, year: number) {
    try {
      const [res]: any = await db.query(
        "CALL obtener_monto_total_mes_efec (?, ?)",
        [month, year]
      );
      return res[0][0];
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw ErrorFactory.internal("Error inesperado del sistema");
    }
  }

  static async getDeliveryAmountToPay() {
    try {
      const [res]: any = await db.query("CALL calcular_total_motoquero()");
      return res[0][0];
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw ErrorFactory.internal("Error inesperado del sistema");
    }
  }

  static async getDeliveryCashAmount() {
    try {
      const [res]: any = await db.query(
        "CALL obtener_monto_total_delivery_hoy_efec()"
      );
      return res[0][0];
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw ErrorFactory.internal("Error inesperado del sistema");
    }
  }

  static async getValueFinanceParam(paramName: string) {
    try {
      const [res]: any = await db.query(
        "SELECT pf.valor FROM parametrosfinancieros pf WHERE pf.nombreParametro = ? ",
        [paramName]
      );
      if (!res.length)
        throw ErrorFactory.badRequest("No se encontro el valor a pagar");
      return res[0];
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw ErrorFactory.internal("Error inesperado del sistema");
    }
  }

  static async updateValueFinanceParam(value: number, paramName: string) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      const [res]: any = await conn.query(
        "UPDATE parametrosfinancieros pf SET pf.valor = ? WHERE pf.nombreParametro = ?",
        [value, paramName]
      );
      if (!res.length)
        throw ErrorFactory.badRequest("No se encontro el valor a pagar");
      await conn.commit();
      return res[0];
    } catch (error) {
      await conn.rollback();
      if (error instanceof AppError) {
        throw error;
      }
    } finally {
      conn.release();
    }
  }
}
