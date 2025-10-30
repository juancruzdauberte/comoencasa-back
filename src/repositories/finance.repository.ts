import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { db } from "../db/db";
import {
  AmountResponseDTO,
  DeliveryAmountResponseDTO,
  FinanceParamResponseDTO,
} from "../dtos/finance.dto";
import { ErrorFactory } from "../errors/errorFactory";
import { AppError } from "../errors/errors";
import { IFinanceRepository } from "../interfaces/finance.interface";
import { secureLogger } from "../config/logger";

export class FinanceRepository implements IFinanceRepository {
  async getConnection(): Promise<PoolConnection> {
    return await db.getConnection();
  }

  async getAmountToday(): Promise<AmountResponseDTO> {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        "SELECT COALESCE(SUM(pc.monto),0) AS total FROM pagocliente pc WHERE DATE(pc.fechaPago) = DATE(DATE_SUB(NOW(), INTERVAL 3 HOUR));"
      );

      if (!rows || rows.length === 0) {
        throw ErrorFactory.internal("Error al obtener el monto de hoy");
      }

      return rows[0] as AmountResponseDTO;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      secureLogger.error("Error fetching amount today", error);
      throw ErrorFactory.internal("Error al obtener el monto de hoy");
    }
  }

  async getTransferAmountToday(): Promise<AmountResponseDTO> {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        "SELECT COALESCE(SUM(pc.monto),0) AS total FROM pagocliente pc WHERE DATE(pc.fechaPago) = DATE(DATE_SUB(NOW(), INTERVAL 3 HOUR)) AND pc.metodoPago = 'transferencia'"
      );

      if (!rows || rows.length === 0) {
        throw ErrorFactory.internal(
          "Error al obtener el monto de transferencias de hoy"
        );
      }

      return rows[0] as AmountResponseDTO;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      secureLogger.error("Error fetching transfer amount today", error);
      throw ErrorFactory.internal(
        "Error al obtener el monto de transferencias de hoy"
      );
    }
  }

  async getCashAmountToday(): Promise<AmountResponseDTO> {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        "SELECT COALESCE(SUM(pc.monto),0) AS total FROM pagocliente pc WHERE DATE(pc.fechaPago) = DATE(DATE_SUB(NOW(), INTERVAL 3 HOUR)) AND pc.metodoPago = 'efectivo';"
      );

      if (!rows || rows.length === 0) {
        throw ErrorFactory.internal(
          "Error al obtener el monto en efectivo de hoy"
        );
      }
      return rows[0] as AmountResponseDTO;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      secureLogger.error("Error fetching cash amount today", error);
      throw ErrorFactory.internal(
        "Error al obtener el monto en efectivo de hoy"
      );
    }
  }

  async getAmountMonthly(
    month: number,
    year: number
  ): Promise<AmountResponseDTO> {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        "SELECT COALESCE(SUM(pc.monto),0) AS total FROM pagocliente pc WHERE MONTH(pc.fechaPago) = ? AND YEAR(pc.fechaPago) = ?",
        [month, year]
      );

      if (!rows || rows.length === 0) {
        throw ErrorFactory.internal("Error al obtener el monto mensual");
      }

      return rows[0] as AmountResponseDTO;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      secureLogger.error("Error fetching monthly amount", error, {
        month,
        year,
      });
      throw ErrorFactory.internal("Error al obtener el monto mensual");
    }
  }

  async getTransferAmountMonthly(
    month: number,
    year: number
  ): Promise<AmountResponseDTO> {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        "SELECT COALESCE(SUM(pc.monto),0) AS total FROM pagocliente pc WHERE MONTH(pc.fechaPago) = ? AND YEAR(pc.fechaPago) = ? AND pc.metodoPago = 'transferencia'",
        [month, year]
      );

      if (!rows || rows.length === 0) {
        throw ErrorFactory.internal(
          "Error al obtener el monto de transferencias mensual"
        );
      }

      return rows[0] as AmountResponseDTO;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      secureLogger.error("Error fetching monthly transfer amount", error, {
        month,
        year,
      });
      throw ErrorFactory.internal(
        "Error al obtener el monto de transferencias mensual"
      );
    }
  }

  async getCashAmountMonthly(
    month: number,
    year: number
  ): Promise<AmountResponseDTO> {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        "SELECT COALESCE(SUM(pc.monto),0) AS total FROM pagocliente pc WHERE MONTH(pc.fechaPago) = ? AND YEAR(pc.fechaPago) = ? AND pc.metodoPago = 'efectivo'",
        [month, year]
      );

      if (!rows || rows.length === 0) {
        throw ErrorFactory.internal(
          "Error al obtener el monto en efectivo mensual"
        );
      }

      return rows[0] as AmountResponseDTO;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      secureLogger.error("Error fetching monthly cash amount", error, {
        month,
        year,
      });
      throw ErrorFactory.internal(
        "Error al obtener el monto en efectivo mensual"
      );
    }
  }

  async getDeliveryAmountToPay(): Promise<DeliveryAmountResponseDTO> {
    try {
      // Los stored procedures retornan el resultado en rows[0]
      const [rows] = await db.query<RowDataPacket[][]>(
        "CALL calcular_total_motoquero()"
      );

      // El resultado del SP está en rows[0][0]
      if (!rows || !rows[0] || rows[0].length === 0) {
        throw ErrorFactory.internal(
          "Error al obtener el monto a pagar al delivery"
        );
      }

      return rows[0][0] as DeliveryAmountResponseDTO;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      secureLogger.error("Error fetching delivery amount to pay", error);
      throw ErrorFactory.internal(
        "Error al obtener el monto a pagar al delivery"
      );
    }
  }

  async getDeliveryCashAmount(): Promise<AmountResponseDTO> {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        "SELECT COALESCE(SUM(pc.monto),0) AS total FROM pagocliente pc INNER JOIN pedido p ON p.id = pc.pedido_id WHERE DATE(pc.fechaPago) = DATE(DATE_SUB(NOW(), INTERVAL 3 HOUR)) AND pc.metodoPago = 'efectivo' AND p.domicilio IS NOT NULL"
      );

      if (!rows || rows.length === 0) {
        throw ErrorFactory.internal(
          "Error al obtener el monto en efectivo del delivery"
        );
      }

      return rows[0] as AmountResponseDTO;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      secureLogger.error("Error fetching delivery cash amount", error);
      throw ErrorFactory.internal(
        "Error al obtener el monto en efectivo del delivery"
      );
    }
  }

  async getFinanceParamValue(
    paramName: string
  ): Promise<FinanceParamResponseDTO> {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        "SELECT pf.valor FROM parametrosfinancieros pf WHERE pf.nombreParametro = ?",
        [paramName]
      );

      if (rows.length === 0) {
        throw ErrorFactory.notFound(
          `Parámetro financiero '${paramName}' no encontrado`
        );
      }

      return rows[0] as FinanceParamResponseDTO;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      secureLogger.error("Error fetching finance param value", error, {
        paramName,
      });
      throw ErrorFactory.internal("Error al obtener el parámetro financiero");
    }
  }

  async updateFinanceParamValue(
    value: number,
    paramName: string
  ): Promise<void> {
    const conn = await this.getConnection();

    try {
      await conn.beginTransaction();

      const [result] = await conn.query<ResultSetHeader>(
        "UPDATE parametrosfinancieros pf SET pf.valor = ? WHERE pf.nombreParametro = ?",
        [value, paramName]
      );

      if (result.affectedRows === 0) {
        throw ErrorFactory.notFound(
          `Parámetro financiero '${paramName}' no encontrado`
        );
      }

      await conn.commit();

      secureLogger.info("Finance param updated successfully", {
        paramName,
        value,
      });
    } catch (error) {
      await conn.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      secureLogger.error("Error updating finance param", error, {
        paramName,
        value,
      });
      throw ErrorFactory.internal(
        "Error al actualizar el parámetro financiero"
      );
    } finally {
      conn.release();
    }
  }
}
