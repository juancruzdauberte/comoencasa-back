import { Router } from "express";
import {
  getProductsCategory,
  getProductsByCategory,
  getPrductById,
} from "../controllers/products.controller";

const router = Router();

router.get("/categorys", getProductsCategory);
router.get("/", getProductsByCategory);
router.get("/:id", getPrductById);

export default router;
