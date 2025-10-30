import { secureLogger } from "../config/logger";
import { ErrorFactory } from "../errors/errorFactory";
import { AppError } from "../errors/errors";
import {
  ICategoryRepository,
  IProductRepository,
} from "../interfaces/product.interface";
import { withTransaction } from "../utils/database.utils";

export class ProductService {
  constructor(
    private productRepository: IProductRepository,
    private categoryRepository: ICategoryRepository
  ) {}

  async getAllProducts() {
    return await this.productRepository.findAll();
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
      Number(categoryId)
    );

    if (!categoryExists) {
      throw ErrorFactory.notFound(
        `Categoría con ID ${categoryId} no encontrada`
      );
    }

    return await this.productRepository.findByCategory(categoryId);
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
          conn
        );
      });

      secureLogger.info("Product created successfully", {
        name: trimmedName,
        categoryId,
      });
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
    return await this.categoryRepository.findAll();
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
        `Categoría con nombre "${name}" no encontrada`
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
}
