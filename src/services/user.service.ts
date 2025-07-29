import { db } from "../db/db";
import { ErrorFactory } from "../errors/errorFactory";
import { AppError } from "../errors/errors";
import { User } from "../types/types";

class UserService {
  static async getUser(email: string): Promise<User> {
    const conn = await db.getConnection();
    try {
      const [res]: any = await conn.query("CALL obtener_usuario(?)", [email]);
      return res[0][0];
    } catch (error) {
      await conn.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      throw ErrorFactory.internal("Error inesperado del sistema");
    } finally {
      conn.release();
    }
  }
}

export default UserService;
