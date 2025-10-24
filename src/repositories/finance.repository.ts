import { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { db } from '../db/db';
import {
  AmountResponseDTO,
  DeliveryAmountResponseDTO,
  FinanceParamResponseDTO,
} from '../dtos/finance.dto';
import { ErrorFactory } from '../errors/errorFactory';
import { AppError } from '../errors/errors';
import { IFinanceRepository } from '../interfaces/finance.interface';
import { secureLogger } from '../config/logger';

export class FinanceRepository implements IFinanceRepository {
  async getConnection(): Promise<PoolConnection> {
    return await db.getConnection();
  }

  async getAmountToday(): Promise<AmountResponseDTO> {
    try {
      const [res]: any = await db.query('CALL obtener_monto_total_hoy()');

      if (!res || !res[0] || !res[0][0]) {
        throw ErrorFactory.internal('Error al obtener el monto de hoy');
      }

      return res[0][0] as AmountResponseDTO;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      secureLogger.error('Error fetching amount today', error);
      throw ErrorFactory.internal('Error al obtener el monto de hoy');
    }
  }

  async getTransferAmountToday(): Promise<AmountResponseDTO> {
    try {
      const [res]: any = await db.query('CALL obtener_monto_total_hoy_trans()');

      if (!res || !res[0] || !res[0][0]) {
        throw ErrorFactory.internal(
          'Error al obtener el monto de transferencias de hoy'
        );
      }

      return res[0][0] as AmountResponseDTO;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      secureLogger.error('Error fetching transfer amount today', error);
      throw ErrorFactory.internal(
        'Error al obtener el monto de transferencias de hoy'
      );
    }
  }

  async getCashAmountToday(): Promise<AmountResponseDTO> {
    try {
      const [res]: any = await db.query('CALL obtener_monto_total_hoy_efec()');

      if (!res || !res[0] || !res[0][0]) {
        throw ErrorFactory.internal(
          'Error al obtener el monto en efectivo de hoy'
        );
      }

      return res[0][0] as AmountResponseDTO;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      secureLogger.error('Error fetching cash amount today', error);
      throw ErrorFactory.internal(
        'Error al obtener el monto en efectivo de hoy'
      );
    }
  }

  async getAmountMonthly(
    month: number,
    year: number
  ): Promise<AmountResponseDTO> {
    try {
      const [res]: any = await db.query('CALL obtener_monto_total_mes(?, ?)', [
        month,
        year,
      ]);

      if (!res || !res[0] || !res[0][0]) {
        throw ErrorFactory.internal('Error al obtener el monto mensual');
      }

      return res[0][0] as AmountResponseDTO;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      secureLogger.error('Error fetching monthly amount', error, {
        month,
        year,
      });
      throw ErrorFactory.internal('Error al obtener el monto mensual');
    }
  }

  async getTransferAmountMonthly(
    month: number,
    year: number
  ): Promise<AmountResponseDTO> {
    try {
      const [res]: any = await db.query(
        'CALL obtener_monto_total_mes_trans(?, ?)',
        [month, year]
      );

      if (!res || !res[0] || !res[0][0]) {
        throw ErrorFactory.internal(
          'Error al obtener el monto de transferencias mensual'
        );
      }

      return res[0][0] as AmountResponseDTO;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      secureLogger.error('Error fetching monthly transfer amount', error, {
        month,
        year,
      });
      throw ErrorFactory.internal(
        'Error al obtener el monto de transferencias mensual'
      );
    }
  }

  async getCashAmountMonthly(
    month: number,
    year: number
  ): Promise<AmountResponseDTO> {
    try {
      const [res]: any = await db.query(
        'CALL obtener_monto_total_mes_efec(?, ?)',
        [month, year]
      );

      if (!res || !res[0] || !res[0][0]) {
        throw ErrorFactory.internal(
          'Error al obtener el monto en efectivo mensual'
        );
      }

      return res[0][0] as AmountResponseDTO;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      secureLogger.error('Error fetching monthly cash amount', error, {
        month,
        year,
      });
      throw ErrorFactory.internal(
        'Error al obtener el monto en efectivo mensual'
      );
    }
  }

  async getDeliveryAmountToPay(): Promise<DeliveryAmountResponseDTO> {
    try {
      const [res]: any = await db.query('CALL calcular_total_motoquero()');

      if (!res || !res[0] || !res[0][0]) {
        throw ErrorFactory.internal(
          'Error al obtener el monto a pagar al delivery'
        );
      }

      return res[0][0] as DeliveryAmountResponseDTO;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      secureLogger.error('Error fetching delivery amount to pay', error);
      throw ErrorFactory.internal(
        'Error al obtener el monto a pagar al delivery'
      );
    }
  }

  async getDeliveryCashAmount(): Promise<AmountResponseDTO> {
    try {
      const [res]: any = await db.query(
        'CALL obtener_monto_total_delivery_hoy_efec()'
      );

      if (!res || !res[0] || !res[0][0]) {
        throw ErrorFactory.internal(
          'Error al obtener el monto en efectivo del delivery'
        );
      }

      return res[0][0] as AmountResponseDTO;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      secureLogger.error('Error fetching delivery cash amount', error);
      throw ErrorFactory.internal(
        'Error al obtener el monto en efectivo del delivery'
      );
    }
  }

  async getFinanceParamValue(
    paramName: string
  ): Promise<FinanceParamResponseDTO> {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        'SELECT pf.valor FROM parametrosfinancieros pf WHERE pf.nombreParametro = ?',
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
      secureLogger.error('Error fetching finance param value', error, {
        paramName,
      });
      throw ErrorFactory.internal('Error al obtener el parámetro financiero');
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
        'UPDATE parametrosfinancieros pf SET pf.valor = ? WHERE pf.nombreParametro = ?',
        [value, paramName]
      );

      if (result.affectedRows === 0) {
        throw ErrorFactory.notFound(
          `Parámetro financiero '${paramName}' no encontrado`
        );
      }

      await conn.commit();

      secureLogger.info('Finance param updated successfully', {
        paramName,
        value,
      });
    } catch (error) {
      await conn.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      secureLogger.error('Error updating finance param', error, {
        paramName,
        value,
      });
      throw ErrorFactory.internal('Error al actualizar el parámetro financiero');
    } finally {
      conn.release();
    }
  }
}
