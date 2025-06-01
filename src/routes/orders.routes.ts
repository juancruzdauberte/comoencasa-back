import { Router } from "express";
import {
  createOrder,
  addProductToOrder,
  getOrders,
  getOrderDetail,
} from "../controllers/orders.controller";

const router = Router();

router.get("/", getOrders);
router.get("/:id", getOrderDetail);
router.post("/", createOrder);
router.post("/add", addProductToOrder);

export default router;
