import { NextFunction, Request, Response } from "express";
import { ProductService } from "../services/products.service";
import { ErrorFactory } from "../errors/errorFactory";
import {
  CreateCategoryRequestDTO,
  CreateProductRequestDTO,
  ProductQueryParamsDTO,
} from "../dtos/product.dto";
import { redisClient } from "../config/redis.config";

const ALL_PRODUCTS_URL = "/api/products";

export class ProductController {
  constructor(private productService: ProductService) {}

  getProductsCategory = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      // <-- CAMBIO: Usamos una clave estática y predecible.
      const cacheKey = "products:categories:list";

      const reply = await redisClient.get(cacheKey);

      if (reply) {
        console.log(`✅ HIT: Sirviendo ${cacheKey}`);
        return res.json(JSON.parse(reply));
      }

      console.log(`❌ MISS: Obteniendo ${cacheKey}`);
      const data = await this.productService.getProductsCategory();
      await redisClient.set(cacheKey, JSON.stringify(data));
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  };

  getProductsByCategory = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      // <-- BIEN: Esta clave es dinámica y funciona bien para listas filtradas.
      const cacheKey = `products:${req.originalUrl}`;
      const reply = await redisClient.get(cacheKey);

      if (reply) {
        console.log(`✅ HIT: Sirviendo ${cacheKey}`);
        return res.json(JSON.parse(reply));
      }
      console.log(`❌ MISS: Obteniendo ${cacheKey}`);

      // ... (resto de tu lógica, está perfecta) ...
      const { category } = req.query as ProductQueryParamsDTO;
      let data;
      if (!category) {
        data = await this.productService.getAllProducts();
      } else if (typeof category === "string") {
        data = await this.productService.getProductsByCategory(category);
      } else {
        throw ErrorFactory.badRequest("Categoría inválida");
      }
      await redisClient.set(cacheKey, JSON.stringify(data));
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  };

  getProductById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { pid } = req.params;

      // <-- BIEN: Clave estandarizada y predecible para un solo item.
      const cacheKey = `products:${pid}`;
      const reply = await redisClient.get(cacheKey);

      if (reply) {
        console.log(`✅ HIT: Sirviendo ${cacheKey}`);
        return res.json(JSON.parse(reply));
      }
      console.log(`❌ MISS: Obteniendo ${cacheKey}`);

      if (!pid) {
        throw ErrorFactory.badRequest("ID de producto es requerido");
      }

      const data = await this.productService.getProductById(parseInt(pid));
      await redisClient.set(cacheKey, JSON.stringify(data));
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  };

  createProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { nombre, categoria_id } = req.body as CreateProductRequestDTO;

      if (!nombre || !categoria_id) {
        throw ErrorFactory.badRequest("Nombre y categoría son requeridos");
      }

      const productId = await this.productService.createProduct(
        nombre,
        categoria_id
      );

      // --- 👇 CORRECCIÓN DE INVALIDACIÓN 👇 ---

      // 1. Invalida la lista de "todos los productos"
      const allProductsKey = `products:${ALL_PRODUCTS_URL}`;
      console.log(`Invalidando: ${allProductsKey}`);
      redisClient.del(allProductsKey);

      // 2. Invalida la lista de la categoría específica
      const categoryListKey = `products:${ALL_PRODUCTS_URL}?category=${categoria_id}`;
      console.log(`Invalidando: ${categoryListKey}`);
      redisClient.del(categoryListKey);

      // --- ------------------------------- ---

      res.status(201).json({
        message: `Producto creado: ${nombre}`,
        id: productId,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { pid } = req.params;

      if (!pid) {
        throw ErrorFactory.badRequest("ID de producto es requerido");
      }

      // (Opcional: si necesitas invalidar la lista de categorías,
      // deberías obtener el producto ANTES de borrarlo para saber su categoria_id)

      await this.productService.deleteProduct(Number(pid));

      // --- 👇 CORRECCIÓN DE INVALIDACIÓN 👇 ---

      // 1. Invalida el producto individual (de getProductById)
      const productKey = `products:${pid}`;
      console.log(`Invalidando: ${productKey}`);
      redisClient.del(productKey);

      // 2. Invalida la lista de "todos los productos"
      const allProductsKey = `products:${ALL_PRODUCTS_URL}`;
      console.log(`Invalidando: ${allProductsKey}`);
      redisClient.del(allProductsKey);

      // (Aquí también deberías invalidar la lista de su categoría si la sabes)

      // --- ------------------------------- ---

      res.status(200).json({ message: "Producto eliminado" });
    } catch (error) {
      next(error);
    }
  };

  deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { cid } = req.params;

      if (!cid) {
        throw ErrorFactory.badRequest("ID de categoría es requerido");
      }

      await this.productService.deleteCategory(Number(cid));

      // --- 👇 CORRECCIÓN DE INVALIDACIÓN 👇 ---
      // Invalida la lista de categorías (de getProductsCategory)
      const categoriesKey = "products:categories:list";
      console.log(`Invalidando: ${categoriesKey}`);
      redisClient.del(categoriesKey);
      // --- ------------------------------- ---

      res.status(200).json({ message: "Categoría eliminada" });
    } catch (error) {
      next(error);
    }
  };

  createCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { nombre } = req.body as CreateCategoryRequestDTO;

      if (!nombre) {
        throw ErrorFactory.badRequest("Nombre de categoría es requerido");
      }

      const categoryId = await this.productService.createCategory(nombre);

      // --- 👇 CORRECCIÓN DE INVALIDACIÓN 👇 ---
      // Invalida la lista de categorías (de getProductsCategory)
      const categoriesKey = "products:categories:list";
      console.log(`Invalidando: ${categoriesKey}`);
      redisClient.del(categoriesKey);
      // --- ------------------------------- ---

      res.status(201).json({
        message: `Categoría creada: ${nombre}`,
        id: categoryId,
      });
    } catch (error) {
      next(error);
    }
  };
}
