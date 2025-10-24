import { UserRepository } from "../repositories/user.repository";
import { ErrorFactory } from "../errors/errorFactory";
import { UserDTO } from "../dtos/auth.dto";

export class UserService {
  private static userRepository = new UserRepository();

  /**
   * Obtiene un usuario por su email
   * @param email Email del usuario
   * @returns Usuario encontrado
   * @throws NotFoundError si el usuario no existe
   */
  static async getUserByEmail(email: string): Promise<UserDTO> {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw ErrorFactory.notFound(`Usuario con email ${email} no encontrado`);
    }

    return user;
  }
}

export default UserService;
