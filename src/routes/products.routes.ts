import { Router } from "express";
import {
  getProductsCategory,
  getProductsByCategory,
  getPrductById,
  createProduct,
  createCategory,
} from "../controllers/products.controller";

const router = Router();

router.get("/categorys", getProductsCategory);
router.get("/", getProductsByCategory);
router.get("/:id", getPrductById);
router.post("/", createProduct);
router.post("/category", createCategory);

export default router;
