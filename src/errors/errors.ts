export class NotFoundError extends Error {
  statusCode = 404;
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class BadRequestError extends Error {
  statusCode = 400;
  constructor(message: string) {
    super(message);
    this.name = "BadRequestError";
  }
}
export class UnauthorizedError extends Error {
  statusCode = 401;
  constructor(message: string = "No autorizado.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}
