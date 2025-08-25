import { NextFunction, Request, Response } from "express";
import { ProductService } from "../services/products.service";
import { ErrorFactory } from "../errors/errorFactory";

export async function getProductsCategory(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const products = await ProductService.getProductsCategory();
    res.status(200).json(products);
  } catch (error) {
    next(error);
  }
}

export async function getProductsByCategory(
  req: Request,
  res: Response,
  next: NextFunction
) {
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

export async function getPrductById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { pid } = req.params;
  try {
    const product = await ProductService.getProductById(parseInt(pid));
    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
}

export async function createProduct(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { nombre, categoria_id } = req.body;
  try {
    const product = await ProductService.createProduct(nombre, categoria_id);
    if (!product) throw ErrorFactory.badRequest("Error al crear el producto");
    res.status(201).json({ message: `Producto creado ${nombre}` });
  } catch (error) {
    next(error);
  }
}

export async function deleteProduct(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { pid } = req.params;
    await ProductService.deleteProduct(Number(pid));
    res.status(200).json({ message: "Producto eliminado" });
  } catch (error) {
    next(error);
  }
}

export async function deleteCategory(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { cid } = req.params;
    await ProductService.deleteCategory(Number(cid));
    res.status(200).json({ message: "Categoria eliminada" });
  } catch (error) {
    next(error);
  }
}

export async function createCategory(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { nombre } = req.body;
  try {
    const cateogry = await ProductService.createCategory(nombre);
    if (!cateogry) throw ErrorFactory.badRequest("Error al crear la categoria");
    res.status(201).json({ message: `Categoria creada ${cateogry}` });
  } catch (error) {
    next(error);
  }
}
