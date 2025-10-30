import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { db } from "../db/db";
import {
  AmountResponseDTO,
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

  private async getAggregatedAmount(
    baseQuery: string,
    whereClauses: string[],
    params: (string | number)[]
  ): Promise<AmountResponseDTO> {
    const query = `${baseQuery} ${
      whereClauses.length > 0 ? "WHERE " + whereClauses.join(" AND ") : ""
    }`;

    try {
      const [rows] = await db.query<RowDataPacket[]>(query, params);

      return rows[0] as AmountResponseDTO;
    } catch (error) {
      secureLogger.error("Error fetching aggregated amount", error, {
        query,
        params,
      });
      if (error instanceof AppError) throw error;
      throw ErrorFactory.internal("Error al obtener monto agregado");
    }
  }

  private get baseAmountQuery(): string {
    return "SELECT COALESCE(SUM(pc.monto),0) AS total FROM pagocliente pc";
  }

  private get todayDateClause(): string {
    return "DATE(pc.fechaPago) = DATE(DATE_SUB(NOW(), INTERVAL 3 HOUR))";
  }

  async getAmountToday(): Promise<AmountResponseDTO> {
    return this.getAggregatedAmount(
      this.baseAmountQuery,
      [this.todayDateClause],
      []
    );
  }

  async getTransferAmountToday(): Promise<AmountResponseDTO> {
    return this.getAggregatedAmount(
      this.baseAmountQuery,
      [this.todayDateClause, "pc.metodoPago = ?"],
      ["transferencia"]
    );
  }

  async getCashAmountToday(): Promise<AmountResponseDTO> {
    return this.getAggregatedAmount(
      this.baseAmountQuery,
      [this.todayDateClause, "pc.metodoPago = ?"],
      ["efectivo"]
    );
  }

  async getAmountMonthly(
    month: number,
    year: number
  ): Promise<AmountResponseDTO> {
    return this.getAggregatedAmount(
      this.baseAmountQuery,
      ["MONTH(pc.fechaPago) = ?", "YEAR(pc.fechaPago) = ?"],
      [month, year]
    );
  }

  async getTransferAmountMonthly(
    month: number,
    year: number
  ): Promise<AmountResponseDTO> {
    return this.getAggregatedAmount(
      this.baseAmountQuery,
      [
        "MONTH(pc.fechaPago) = ?",
        "YEAR(pc.fechaPago) = ?",
        "pc.metodoPago = ?",
      ],
      [month, year, "transferencia"]
    );
  }

  async getCashAmountMonthly(
    month: number,
    year: number
  ): Promise<AmountResponseDTO> {
    return this.getAggregatedAmount(
      this.baseAmountQuery,
      [
        "MONTH(pc.fechaPago) = ?",
        "YEAR(pc.fechaPago) = ?",
        "pc.metodoPago = ?",
      ],
      [month, year, "efectivo"]
    );
  }

  async getDeliveryAmountToPay(): Promise<AmountResponseDTO> {
    try {
      const [rows] = await db.query<RowDataPacket[][]>(
        "CALL calcular_total_motoquero()"
      );

      if (!rows || !rows[0] || (rows[0] as any).length === 0) {
        throw ErrorFactory.internal(
          "Error al obtener el monto a pagar al delivery"
        );
      }

      return rows[0][0] as AmountResponseDTO;
    } catch (error) {
      if (error instanceof AppError) throw error;
      secureLogger.error("Error fetching delivery amount to pay", error);
      throw ErrorFactory.internal(
        "Error al obtener el monto a pagar al delivery"
      );
    }
  }

  async getDeliveryCashAmount(): Promise<AmountResponseDTO> {
    const query =
      "SELECT COALESCE(SUM(pc.monto),0) AS total FROM pagocliente pc INNER JOIN pedido p ON p.id = pc.pedido_id WHERE DATE(pc.fechaPago) = DATE(DATE_SUB(NOW(), INTERVAL 3 HOUR)) AND pc.metodoPago = 'efectivo' AND p.domicilio IS NOT NULL";
    try {
      const [rows] = await db.query<RowDataPacket[]>(query);
      return rows[0] as AmountResponseDTO;
    } catch (error) {
      if (error instanceof AppError) throw error;
      secureLogger.error("Error fetching delivery cash amount", error);
      throw ErrorFactory.internal(
        "Error al obtener el monto en efectivo del delivery"
      );
    }
  }

  async getFinanceParamValue(
    paramName: string
  ): Promise<FinanceParamResponseDTO | null> {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        "SELECT pf.valor FROM parametrosfinancieros pf WHERE pf.nombreParametro = ?",
        [paramName]
      );

      if (rows.length === 0) {
        return null;
      }

      return rows[0] as FinanceParamResponseDTO;
    } catch (error) {
      if (error instanceof AppError) throw error;
      secureLogger.error("Error fetching finance param value", error, {
        paramName,
      });
      throw ErrorFactory.internal("Error al obtener el parámetro financiero");
    }
  }

  async updateFinanceParamValue(
    value: number,
    paramName: string,
    conn: PoolConnection
  ): Promise<ResultSetHeader> {
    const [result] = await conn.query<ResultSetHeader>(
      "UPDATE parametrosfinancieros pf SET pf.valor = ? WHERE pf.nombreParametro = ?",
      [value, paramName]
    );

    return result;
  }
}
