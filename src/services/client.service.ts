import { db } from "../db/db";
import { ErrorFactory } from "../errors/errorFactory";
import { AppError } from "../errors/errors";
import { GetClientResponse } from "../types/types";

export class ClientService {
  static async getClient(phone: string): Promise<GetClientResponse | null> {
    try {
      const [[res]]: any = await db.query("CALL obtener_cliente(?)", [phone]);
      if (!res || res.length === 0) {
        return null;
      }
      return res[0];
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw ErrorFactory.internal("Error inesperado del sistema");
    }
  }
}
