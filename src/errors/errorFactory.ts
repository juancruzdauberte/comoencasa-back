import {
  BadRequestError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  UnauthorizedError,
} from "./errors";

export class ErrorFactory {
  static badRequest(message: string) {
    return new BadRequestError(message);
  }
  static notFound(message: string) {
    return new NotFoundError(message);
  }
  static internal(message: string) {
    return new InternalServerError(message);
  }
  static unauthorized(message: string) {
    return new UnauthorizedError(message);
  }
  static forbidden(message: string) {
    return new ForbiddenError(message);
  }
}
