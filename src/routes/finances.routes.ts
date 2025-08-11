import { Router } from "express";
import {
  getAmountMonthly,
  getAmountToday,
  getCashAmountMonthly,
  getCashAmountToday,
  getTransferAmountToday,
  getTrasnferAmountMonthly,
} from "../controllers/finances.controller";

const router = Router();

router.get("/today", getAmountToday);
router.get("/today/transfer", getTransferAmountToday);
router.get("/today/cash", getCashAmountToday);
router.get("/monthly", getAmountMonthly);
router.get("/monthly/cash", getCashAmountMonthly);
router.get("/monthly/transfer", getTrasnferAmountMonthly);

export default router;
