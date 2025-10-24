import { UserDTO } from "../dtos/auth.dto";
import { IBaseRepository } from "./repository.interface";

export interface IUserRepository extends IBaseRepository {
  /**
   * Busca un usuario por su email
   * @param email Email del usuario
   * @returns Usuario encontrado o null
   */
  findByEmail(email: string): Promise<UserDTO | null>;
}
