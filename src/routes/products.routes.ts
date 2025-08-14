import { Router } from "express";
import {
  getProductsCategory,
  getProductsByCategory,
  getPrductById,
  createProduct,
  createCategory,
  deleteProduct,
  deleteCategory,
} from "../controllers/products.controller";

const router = Router();

router.get("/categorys", getProductsCategory);
router.get("/", getProductsByCategory);
router.get("/:pid", getPrductById);
router.delete("/:pid", deleteProduct);
router.delete("/:cid", deleteCategory);
router.post("/", createProduct);
router.post("/category", createCategory);

export default router;
