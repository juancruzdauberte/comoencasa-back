import { Router } from "express";
import {
  getAmountMonthly,
  getAmountToday,
  getCashAmountMonthly,
  getCashAmountToday,
  getDeliveryAmountToPay,
  getValueFinanceParam,
  getTransferAmountToday,
  getTrasnferAmountMonthly,
  updateValueFinanceParam,
  getDeliveryCashAmount,
} from "../controllers/finances.controller";

const router = Router();

router.get("/today", getAmountToday);
router.get("/today/transfer", getTransferAmountToday);
router.get("/today/cash", getCashAmountToday);
router.get("/today/delivery/pay", getDeliveryAmountToPay);
router.get("/today/delivery/cash", getDeliveryCashAmount);
router.get("/param", getValueFinanceParam);
router.put("/param", updateValueFinanceParam);
router.get("/monthly", getAmountMonthly);
router.get("/monthly/cash", getCashAmountMonthly);
router.get("/monthly/transfer", getTrasnferAmountMonthly);

export default router;
