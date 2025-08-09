import { db } from "../db/db";
import { GetClientResponse } from "../types/types";

export class ClientService {
  static async getClient(phone: string): Promise<GetClientResponse | null> {
    const conn = await db.getConnection();
    try {
      const [[res]]: any = await conn.query("CALL obtener_cliente(?)", [phone]);
      if (!res || res.length === 0) {
        return null;
      }
      return res[0];
    } catch (error) {
      await conn.rollback();
      console.log(error);
      throw error;
    } finally {
      conn.release();
    }
  }
}
