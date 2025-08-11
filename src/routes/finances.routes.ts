import { Router } from "express";
import {
  getAmountToday,
  getCashAmountToday,
  getTransferAmountToday,
} from "../controllers/finances.controller";

const router = Router();

router.get("/today", getAmountToday);
router.get("/today/transfer", getTransferAmountToday);
router.get("/today/cash", getCashAmountToday);

export default router;
