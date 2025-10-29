import { NextFunction, Request, Response } from "express";
import { ProductService } from "../services/products.service";
import { ErrorFactory } from "../errors/errorFactory";
import {
  CreateCategoryRequestDTO,
  CreateProductRequestDTO,
  ProductQueryParamsDTO,
} from "../dtos/product.dto";
import { CategoryRepository, ProductRepository } from "../repositories";

const productRepository = new ProductRepository();
const cateogryRepository = new CategoryRepository();
const productService = new ProductService(
  productRepository,
  cateogryRepository
);

export async function getProductsCategory(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const categories = await productService.getProductsCategory();
    res.status(200).json(categories);
  } catch (error) {
    next(error);
  }
}

export async function getProductsByCategory(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { category } = req.query as ProductQueryParamsDTO;

    let products;
    if (!category) {
      products = await productService.getAllProducts();
    } else if (typeof category === "string") {
      products = await productService.getProductsByCategory(category);
    } else {
      throw ErrorFactory.badRequest("Categoría inválida");
    }

    res.status(200).json(products);
  } catch (error) {
    next(error);
  }
}

export async function getProductById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { pid } = req.params;

    if (!pid) {
      throw ErrorFactory.badRequest("ID de producto es requerido");
    }

    const product = await productService.getProductById(parseInt(pid));
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
  try {
    const { nombre, categoria_id } = req.body as CreateProductRequestDTO;

    if (!nombre || !categoria_id) {
      throw ErrorFactory.badRequest("Nombre y categoría son requeridos");
    }

    const productId = await productService.createProduct(nombre, categoria_id);

    res.status(201).json({
      message: `Producto creado: ${nombre}`,
      id: productId,
    });
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

    if (!pid) {
      throw ErrorFactory.badRequest("ID de producto es requerido");
    }

    await productService.deleteProduct(Number(pid));
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

    if (!cid) {
      throw ErrorFactory.badRequest("ID de categoría es requerido");
    }

    await productService.deleteCategory(Number(cid));
    res.status(200).json({ message: "Categoría eliminada" });
  } catch (error) {
    next(error);
  }
}

export async function createCategory(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { nombre } = req.body as CreateCategoryRequestDTO;

    if (!nombre) {
      throw ErrorFactory.badRequest("Nombre de categoría es requerido");
    }

    const categoryId = await productService.createCategory(nombre);

    res.status(201).json({
      message: `Categoría creada: ${nombre}`,
      id: categoryId,
    });
  } catch (error) {
    next(error);
  }
}
