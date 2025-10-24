import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";

export interface IBaseRepository {
  getConnection(): Promise<PoolConnection>;
}

export interface StoredProcedureResultWithTotal<T> {
  data: T[];
  total: number;
}

export type QueryResult<T> = [T[], ResultSetHeader];
export type StoredProcedureResult = RowDataPacket[][];
