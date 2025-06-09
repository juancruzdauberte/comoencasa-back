import { Router } from "express";
import {
  createOrder,
  addProductToOrder,
  getOrders,
  getOrderDetail,
  payOrder,
  deleteProductFromOrder,
  updateProductQuantity,
  updateOrder,
  deleteOrder,
  getOrdersToday,
} from "../controllers/orders.controller";
import { addProductSchema } from "../middlewares/order/addProductToOrderSchema";
import { validateRequest } from "../middlewares/validateRequest";
import { payOrderSchema } from "../middlewares/order/payOrderSchema";

const router = Router();

router.get("/", getOrders);
router.get("/today", getOrdersToday);
router.get("/:oid", getOrderDetail);
router.post("/", createOrder);
router.post("/product", addProductSchema, validateRequest, addProductToOrder);
router.post("/pay", payOrderSchema, validateRequest, payOrder);
router.delete("/:oid/product/:pid", deleteProductFromOrder);
router.delete("/:oid", deleteOrder);
router.patch("/:oid/product/:pid", updateProductQuantity);
router.put("/:oid", updateOrder);
export default router;
