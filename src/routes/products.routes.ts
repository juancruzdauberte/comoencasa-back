import { Router } from "express";
import {
  getProductsCategory,
  getProductsByCategory,
} from "../controllers/products.controller";

const router = Router();

router.get("/categorys", getProductsCategory);
router.get("/", getProductsByCategory);

export default router;
