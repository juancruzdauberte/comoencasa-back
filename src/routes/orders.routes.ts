import { Router } from "express";
import {
  createOrder,
  addProductToOrder,
  getOrders,
  getOrderById,
  insertOrderPayments,
  deleteProductFromOrder,
  updateProductQuantity,
  updateOrder,
  deleteOrder,
  insertPayDate,
} from "../controllers/orders.controller";
import { addProductSchema } from "../middlewares/order/addProductToOrderSchema";
import { validateRequest } from "../middlewares/validateRequest";
import { payOrderSchema } from "../middlewares/order/payOrderSchema";

const router = Router();

router.get("/", getOrders);
router.get("/:oid", getOrderById);
router.post("/", createOrder);
router.post("/product", addProductSchema, validateRequest, addProductToOrder);
router.post("/pay", payOrderSchema, validateRequest, insertOrderPayments);
router.patch("/pay/date/:oid", validateRequest, insertPayDate);
router.delete("/:oid/product/:pid", deleteProductFromOrder);
router.delete("/:oid", deleteOrder);
router.patch("/:oid/product/:pid", updateProductQuantity);
router.put("/:oid", updateOrder);

export default router;
