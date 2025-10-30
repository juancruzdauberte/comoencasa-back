import { PoolConnection, RowDataPacket } from "mysql2/promise";
import { db } from "../db/db";
import { UserDTO } from "../dtos/auth.dto";
import { ErrorFactory } from "../errors/errorFactory";
import { AppError } from "../errors/errors";
import { IUserRepository } from "../interfaces/user.interface";
import { secureLogger } from "../config/logger";

export class UserRepository implements IUserRepository {
  async getConnection(): Promise<PoolConnection> {
    return await db.getConnection();
  }

  async findByEmail(email: string): Promise<UserDTO | null> {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        `SELECT * FROM usuario u WHERE u.email = ?`,
        [email]
      );

      if (rows.length === 0) {
        return null;
      }
      return rows[0] as UserDTO;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      secureLogger.error("Error fetching user by email", error, { email });
      throw ErrorFactory.internal("Error al obtener el usuario");
    }
  }
}
