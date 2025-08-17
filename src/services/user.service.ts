import { db } from "../db/db";
import { ErrorFactory } from "../errors/errorFactory";
import { AppError } from "../errors/errors";
import { User } from "../types/types";

class UserService {
  static async getUser(email: string): Promise<User> {
    try {
      const [res]: any = await db.query("CALL obtener_usuario(?)", [email]);
      return res[0][0];
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw ErrorFactory.internal("Error inesperado del sistema");
    }
  }
}

export default UserService;
