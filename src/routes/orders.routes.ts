import { Router } from "express";
import {
  createOrder,
  addProductToOrder,
  getOrders,
  getOrderById,
  insertOrderDatePay,
  deleteProductFromOrder,
  updateProductQuantity,
  updateOrder,
  deleteOrder,
} from "../controllers/orders.controller";
import { addProductSchema } from "../middlewares/order/addProductToOrderSchema";
import { validateRequest } from "../middlewares/validateRequest";

const router = Router();

router.get("/", getOrders);
router.get("/:oid", getOrderById);
router.post("/", createOrder);
router.post("/product", addProductSchema, validateRequest, addProductToOrder);
router.post("/pay/:oid", insertOrderDatePay);
router.delete("/:oid/product/:pid", deleteProductFromOrder);
router.delete("/:oid", deleteOrder);
router.patch("/:oid/product/:pid", updateProductQuantity);
router.put("/:oid", updateOrder);

export default router;
