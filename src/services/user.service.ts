import { ErrorFactory } from "../errors/errorFactory";
import { UserDTO } from "../dtos/auth.dto";
import { IUserRepository } from "../interfaces/user.interface";

export class UserService {
  constructor(private userRepository: IUserRepository) {}

  async getUserByEmail(email: string): Promise<UserDTO> {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw ErrorFactory.notFound(`Usuario con email ${email} no encontrado`);
    }

    return user;
  }
}

export default UserService;
