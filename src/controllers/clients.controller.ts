import { NextFunction, Request, Response } from "express";
import { ClientService } from "../services/client.service";
import { ErrorFactory } from "../errors/errorFactory";

export async function getClient(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { tel } = req.params;
  try {
    const client = await ClientService.getClient(tel);
    if (!client) {
      throw ErrorFactory.notFound(
        `No se encontro a dicho cliente con el telefono ${tel}`
      );
    }
    res
      .status(200)
      .json({ nombre: client?.nombre, apellido: client?.apellido });
  } catch (error) {
    next(error);
  }
}
