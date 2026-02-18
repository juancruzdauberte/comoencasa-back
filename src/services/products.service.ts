import { secureLogger } from "../config/logger";
import { ErrorFactory } from "../errors/errorFactory";
import { AppError } from "../errors/errors";
import {
  ICategoryRepository,
  IProductRepository,
} from "../interfaces/product.interface";
import { withTransaction } from "../utils/database.utils";
import { redisClient } from "../config/redis.config";

export class ProductService {
  constructor(
    private productRepository: IProductRepository,
    private categoryRepository: ICategoryRepository,
  ) {}

  async getAllProducts() {
    const cacheKey = "products:all";
    const cached = await redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const products = await this.productRepository.findAll();
    await redisClient.set(cacheKey, JSON.stringify(products), { EX: 3600 });
    return products;
  }

  async getProductById(id: number) {
    const product = await this.productRepository.findById(id);

    if (!product) {
      throw ErrorFactory.notFound(`Producto con ID ${id} no encontrado`);
    }

    return product;
  }

  async getProductsByCategory(categoryId: string) {
    const categoryExists = await this.categoryRepository.exists(
      Number(categoryId),
    );

    if (!categoryExists) {
      throw ErrorFactory.notFound(
        `Categoría con ID ${categoryId} no encontrada`,
      );
    }

    const cacheKey = `products:category:${categoryId}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const products = await this.productRepository.findByCategory(categoryId);
    await redisClient.set(cacheKey, JSON.stringify(products), { EX: 3600 });
    return products;
  }

  async createProduct(productName: string, categoryId: number) {
    if (!productName || productName.trim().length === 0) {
      throw ErrorFactory.badRequest("El nombre del producto es requerido");
    }

    const categoryExists = await this.categoryRepository.exists(categoryId);
    if (!categoryExists) {
      throw ErrorFactory.notFound(`Categoría con ID ${categoryId} no existe`);
    }
    const trimmedName = productName.trim();

    try {
      await withTransaction(async (conn) => {
        return await this.productRepository.create(
          trimmedName,
          categoryId,
          conn,
        );
      });

      secureLogger.info("Product created successfully", {
        name: trimmedName,
        categoryId,
      });

      await this.invalidateProductCache(categoryId);
    } catch (error) {
      secureLogger.error("Error creating product", error, {
        name: trimmedName,
        categoryId,
      });
      if (error instanceof AppError) {
        throw error;
      }

      throw ErrorFactory.internal("Error al crear el producto");
    }
  }

  async deleteProduct(id: number) {
    const productExists = await this.productRepository.exists(id);
    if (!productExists) {
      throw ErrorFactory.notFound(`Producto con ID ${id} no encontrado`);
    }
    try {
      await withTransaction(async (conn) => {
        await this.productRepository.delete(id, conn);
        secureLogger.info("Product deleted successfully", { id });
      });
      await this.invalidateProductCache();
    } catch (error) {
      secureLogger.error("Error deleting product", error, {
        id,
      });
      if (error instanceof AppError) {
        throw error;
      }

      throw ErrorFactory.internal("Error al eliminar el producto");
    }
  }

  async getProductsCategory() {
    const cacheKey = "categories:all";
    const cached = await redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const categories = await this.categoryRepository.findAll();
    await redisClient.set(cacheKey, JSON.stringify(categories), { EX: 86400 });
    return categories;
  }

  async getCategoryById(id: number) {
    const category = await this.categoryRepository.findById(id);

    if (!category) {
      throw ErrorFactory.notFound(`Categoría con ID ${id} no encontrada`);
    }

    return category;
  }

  async getCategoryByName(name: string) {
    const category = await this.categoryRepository.findByName(name);

    if (!category) {
      throw ErrorFactory.notFound(
        `Categoría con nombre "${name}" no encontrada`,
      );
    }

    return category;
  }

  async createCategory(categoryName: string) {
    const categoryNameTrimmed = categoryName.trim();
    if (!categoryName || categoryNameTrimmed.length === 0) {
      throw ErrorFactory.badRequest("El nombre de la categoría es requerido");
    }
    try {
      await withTransaction(async (conn) => {
        await this.categoryRepository.create(categoryNameTrimmed, conn);
      });
      await redisClient.del("categories:all");
    } catch (error) {
      secureLogger.error("Error creating category", error, {
        categoryName,
      });
      if (error instanceof AppError) {
        throw error;
      }

      throw ErrorFactory.internal("Error al crear la categoria");
    }
  }

  async deleteCategory(id: number) {
    const categoryExists = await this.categoryRepository.exists(id);
    if (!categoryExists) {
      throw ErrorFactory.notFound(`Categoría con ID ${id} no encontrada`);
    }
    try {
      await withTransaction(async (conn) => {
        await this.categoryRepository.delete(id, conn);
      });
      await redisClient.del("categories:all");
      // Si borramos categoría, también invalidar productos por si acaso
      await this.invalidateProductCache(id);
    } catch (error) {
      secureLogger.error("Error deleting category", error, {
        id,
      });
      if (error instanceof AppError) {
        throw error;
      }

      throw ErrorFactory.internal("Error al eliminar la categoria");
    }
  }

  private async invalidateProductCache(categoryId?: number) {
    const keys = ["products:all"];
    if (categoryId) {
      keys.push(`products:category:${categoryId}`);
    } else {
      // Si no tenemos ID, invalidamos todas las categorías (más costoso pero seguro)
      // Ojo: SCAN es mejor para producción masiva, pero keys aquí es aceptable para escalas pequeñas
      const categoryKeys = await redisClient.keys("products:category:*");
      keys.push(...categoryKeys);
    }
    await redisClient.del(keys);
  }
}
