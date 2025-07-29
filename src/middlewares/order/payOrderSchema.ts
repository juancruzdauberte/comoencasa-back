import { Schema, checkSchema } from "express-validator";

const payOrderSchemaValidator: Schema = {
  pedido_id: {
    in: ["body"],
    isInt: {
      options: { gt: 0 },
      errorMessage: "El ID del pedido debe ser un número positivo",
    },
  },
  monto: {
    in: ["body"],
    isInt: {
      options: { gt: 0 },
      errorMessage: "El monto debe ser mayor a 0",
    },
  },
  metodo_pago: {
    in: ["body"],
    isIn: {
      options: [["efectivo", "transferencia"]],
      errorMessage: "El metodo de pago deve ser 'efectivo' o 'transferencia'",
    },
  },
};

export const payOrderSchema = checkSchema(payOrderSchemaValidator);
