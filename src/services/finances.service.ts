import { db } from "../db/db";
import { AppError } from "../errors/errors";

export class FinanceClass {
  static async getAmountToday() {
    const conn = await db.getConnection();
    try {
      const [res]: any = await conn.query("CALL obtener_monto_total_hoy ()");
      return res[0][0];
    } catch (error) {
      await conn.rollback();
      if (error instanceof AppError) {
        throw error;
      }
    } finally {
      conn.release();
    }
  }

  static async getTransferAmountToday() {
    const conn = await db.getConnection();
    try {
      const [res]: any = await conn.query(
        "CALL obtener_monto_total_hoy_trans ()"
      );
      return res[0][0];
    } catch (error) {
      await conn.rollback();
      if (error instanceof AppError) {
        throw error;
      }
    } finally {
      conn.release();
    }
  }

  static async getCashAmountToday() {
    const conn = await db.getConnection();
    try {
      const [res]: any = await conn.query(
        "CALL obtener_monto_total_hoy_efec ()"
      );
      return res[0][0];
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
