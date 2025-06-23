import { Request, Response } from "express";
import { ProductService } from "../services/products.service";

export async function getProductsCategory(req: Request, res: Response) {
  try {
    const products = await ProductService.getProductsCategory();
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener los productos por categoría",
    });
  }
}

export async function getProductsByCategory(req: Request, res: Response) {
  const { category } = req.query;

  try {
    let products;
    if (!category) {
      products = await ProductService.getAllProducts();
    } else if (typeof category === "string") {
      products = await ProductService.getProductsByCategory(category);
    } else {
      res.status(400).json({ message: "Categoría inválida" });
      return;
    }
    res.status(200).json(products);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al obtener los productos por categoria" });
    return;
  }
}

export async function getPrductById(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const product = await ProductService.getProductById(parseInt(id));
    res.status(200).json(product);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al obtener los productos por categoria" });
    return;
  }
}
