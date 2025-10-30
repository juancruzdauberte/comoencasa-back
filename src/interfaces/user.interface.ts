import { UserDTO } from "../dtos/auth.dto";
import { IBaseRepository } from "./repository.interface";

export interface IUserRepository extends IBaseRepository {
  findByEmail(email: string): Promise<UserDTO | null>;
}
