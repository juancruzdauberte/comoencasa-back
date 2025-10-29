import { ErrorFactory } from "../errors/errorFactory";
import { UserDTO } from "../dtos/auth.dto";
import { IUserRepository } from "../interfaces/user.interface";

export class UserService {
  constructor(private userRepository: IUserRepository) {}
  /**
   * Obtiene un usuario por su email
   * @param email Email del usuario
   * @returns Usuario encontrado
   * @throws NotFoundError si el usuario no existe
   */
  async getUserByEmail(email: string): Promise<UserDTO> {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw ErrorFactory.notFound(`Usuario con email ${email} no encontrado`);
    }

    return user;
  }
}

export default UserService;
