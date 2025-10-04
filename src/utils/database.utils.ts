import { PoolConnection } from "mysql2/promise";
import { db } from "../db/db";
import { secureLogger } from "./logger";

export async function withTransaction<T>(
  callback: (conn: PoolConnection) => Promise<T>
): Promise<T> {
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    secureLogger.debug("Transaction started");

    const result = await callback(conn);

    await conn.commit();
    secureLogger.debug("Transaction committed successfully");

    return result;
  } catch (error) {
    await conn.rollback();
    secureLogger.error("Transaction rolled back due to error", error);
    throw error;
  } finally {
    conn.release();
    secureLogger.debug("Database connection released");
  }
}

export async function batchInsert(
  conn: PoolConnection,
  table: string,
  columns: string[],
  values: any[][]
): Promise<any> {
  if (values.length === 0) {
    throw new Error("No values provided for batch insert");
  }

  if (columns.length === 0) {
    throw new Error("No columns provided for batch insert");
  }

  const placeholders = columns.map(() => "?").join(", ");
  const query = `INSERT INTO ${table} (${columns.join(
    ", "
  )}) VALUES (${placeholders})`;

  const results = [];

  for (const row of values) {
    if (row.length !== columns.length) {
      throw new Error(
        `Value count doesn't match column count. Expected ${columns.length}, got ${row.length}`
      );
    }

    const [result] = await conn.query(query, row);
    results.push(result);
  }

  return results;
}

export async function validateConnection(
  conn: PoolConnection
): Promise<boolean> {
  try {
    await conn.query("SELECT 1");
    return true;
  } catch (error) {
    secureLogger.error("Database connection validation failed", error);
    return false;
  }
}
