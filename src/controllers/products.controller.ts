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

  if (!category || typeof category !== "string") {
    res.status(400).json({ message: "Falta la categoría o es inválida" });
    return;
  }
  try {
    const products = await ProductService.getProductsByCategory(
      category as string
    );
    res.status(200).json(products);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al obtener los productos por categoria" });
    return;
  }
}
