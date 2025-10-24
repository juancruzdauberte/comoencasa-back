import { PoolConnection, ResultSetHeader } from 'mysql2/promise';
import { db } from '../db/db';
import { secureLogger } from '../config/logger';

/**
 * Ejecuta una operación dentro de una transacción de base de datos
 * Maneja automáticamente commit, rollback y release de conexión
 * @param callback Función que contiene la lógica de negocio
 * @returns El resultado de la operación
 */
export async function withTransaction<T>(
  callback: (conn: PoolConnection) => Promise<T>
): Promise<T> {
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();
    secureLogger.debug('Transaction started');

    const result = await callback(conn);

    await conn.commit();
    secureLogger.debug('Transaction committed successfully');

    return result;
  } catch (error) {
    await conn.rollback();
    secureLogger.error('Transaction rolled back due to error', error);
    throw error;
  } finally {
    conn.release();
    secureLogger.debug('Database connection released');
  }
}

/**
 * Inserta múltiples filas en una tabla de manera eficiente
 * Utiliza una sola query con valores múltiples para mejor rendimiento
 * @param conn Conexión de base de datos
 * @param table Nombre de la tabla
 * @param columns Array de nombres de columnas
 * @param values Array de arrays con los valores a insertar
 */
export async function batchInsert(
  conn: PoolConnection,
  table: string,
  columns: string[],
  values: any[][]
): Promise<ResultSetHeader> {
  if (values.length === 0) {
    throw new Error('No values provided for batch insert');
  }

  if (columns.length === 0) {
    throw new Error('No columns provided for batch insert');
  }

  // Validar que todas las filas tengan la misma cantidad de valores
  for (const row of values) {
    if (row.length !== columns.length) {
      throw new Error(
        `Value count doesn't match column count. Expected ${columns.length}, got ${row.length}`
      );
    }
  }

  // Construir query con múltiples valores en una sola inserción
  const placeholders = values.map(() => `(${columns.map(() => '?').join(', ')})`).join(', ');
  const query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${placeholders}`;
  
  // Aplanar el array de valores
  const flatValues = values.flat();

  const [result] = await conn.query<ResultSetHeader>(query, flatValues);

  secureLogger.debug('Batch insert completed', {
    table,
    rowsInserted: values.length,
    affectedRows: result.affectedRows,
  });

  return result;
}

/**
 * Valida si una conexión de base de datos está activa
 * @param conn Conexión a validar
 * @returns true si la conexión es válida
 */
export async function validateConnection(
  conn: PoolConnection
): Promise<boolean> {
  try {
    await conn.query('SELECT 1');
    return true;
  } catch (error) {
    secureLogger.error('Database connection validation failed', error);
    return false;
  }
}

/**
 * Ejecuta una query con retry automático en caso de fallo
 * @param callback Función que contiene la query a ejecutar
 * @param maxRetries Número máximo de reintentos
 * @param delayMs Delay en milisegundos entre reintentos
 */
export async function withRetry<T>(
  callback: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await callback();
    } catch (error) {
      lastError = error as Error;
      secureLogger.warn(`Query attempt ${attempt} failed`, {
        error,
        attemptsRemaining: maxRetries - attempt,
      });

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  secureLogger.error('All retry attempts failed', lastError);
  throw lastError;
}

/**
 * Actualiza múltiples registros de manera eficiente usando CASE
 * @param conn Conexión de base de datos
 * @param table Nombre de la tabla
 * @param idColumn Nombre de la columna de ID
 * @param updateColumn Nombre de la columna a actualizar
 * @param updates Array de objetos {id, value}
 */
export async function batchUpdate(
  conn: PoolConnection,
  table: string,
  idColumn: string,
  updateColumn: string,
  updates: Array<{ id: number | string; value: any }>
): Promise<ResultSetHeader> {
  if (updates.length === 0) {
    throw new Error('No updates provided for batch update');
  }

  const ids = updates.map((u) => u.id);
  const caseStatements = updates
    .map((u) => `WHEN ${idColumn} = ? THEN ?`)
    .join(' ');

  const query = `
    UPDATE ${table}
    SET ${updateColumn} = CASE
      ${caseStatements}
    END
    WHERE ${idColumn} IN (${ids.map(() => '?').join(', ')})
  `;

  // Construir el array de valores: [id1, value1, id2, value2, ..., id1, id2, ...]
  const values = [
    ...updates.flatMap((u) => [u.id, u.value]),
    ...ids,
  ];

  const [result] = await conn.query<ResultSetHeader>(query, values);

  secureLogger.debug('Batch update completed', {
    table,
    rowsUpdated: updates.length,
    affectedRows: result.affectedRows,
  });

  return result;
}
