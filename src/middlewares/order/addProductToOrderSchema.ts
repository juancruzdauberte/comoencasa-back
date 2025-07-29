import { Schema, checkSchema } from "express-validator";

const addProductToOrderSchemaValidator: Schema = {
  pedido_id: {
    in: ["body"],
    isInt: {
      options: { gt: 0 },
      errorMessage: "El ID del pedido debe ser un número positivo",
    },
  },
  producto_id: {
    in: ["body"],
    isInt: {
      options: { gt: 0 },
      errorMessage: "El ID del producto debe ser un número positivo",
    },
  },
  cantidad: {
    in: ["body"],
    isInt: {
      options: { gt: 0 },
      errorMessage: "La cantidad debe ser mayor que 0",
    },
  },
};

export const addProductSchema = checkSchema(addProductToOrderSchemaValidator);
