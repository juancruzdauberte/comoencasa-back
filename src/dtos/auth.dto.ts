export interface LoginRequestDTO {
  email: string;
  password: string;
}

export interface LoginResponseDTO {
  token: string;
  user: UserDTO;
}

export interface RegisterRequestDTO {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  rol?: "admin" | "user";
}

export interface UserDTO {
  id: number;
  email: string;
  rol: "admin" | "user";
}

export interface TokenPayloadDTO {
  email: string;
  rol: string;
}
