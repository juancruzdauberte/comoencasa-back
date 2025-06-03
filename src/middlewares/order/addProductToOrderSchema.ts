import { Schema, checkSchema } from "express-validator";

const addProductToOrderSchemaValidator: Schema = {
  orderId: {
    in: ["body"],
    isInt: {
      options: { gt: 0 },
      errorMessage: "El ID del pedido debe ser un número positivo",
    },
  },
  productId: {
    in: ["body"],
    isInt: {
      options: { gt: 0 },
      errorMessage: "El ID del producto debe ser un número positivo",
    },
  },
  quantity: {
    in: ["body"],
    isInt: {
      options: { gt: 0 },
      errorMessage: "La cantidad debe ser mayor que 0",
    },
  },
};

export const addProductSchema = checkSchema(addProductToOrderSchemaValidator);
