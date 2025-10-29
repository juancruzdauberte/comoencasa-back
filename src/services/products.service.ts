import { ErrorFactory } from "../errors/errorFactory";
import {
  ICategoryRepository,
  IProductRepository,
} from "../interfaces/product.interface";

export class ProductService {
  constructor(
    private productRepository: IProductRepository,
    private categoryRepository: ICategoryRepository
  ) {}

  // ==================== PRODUCT METHODS ====================

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
    // Validar que la categoría existe
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

  async searchProductsByName(name: string) {
    if (!name || name.trim().length < 2) {
      throw ErrorFactory.badRequest(
        "El nombre debe tener al menos 2 caracteres"
      );
    }

    return await this.productRepository.findByName(name.trim());
  }

  async createProduct(productName: string, categoryId: number) {
    // Validar nombre
    if (!productName || productName.trim().length === 0) {
      throw ErrorFactory.badRequest("El nombre del producto es requerido");
    }

    // Validar que la categoría existe
    const categoryExists = await this.categoryRepository.exists(categoryId);
    if (!categoryExists) {
      throw ErrorFactory.notFound(`Categoría con ID ${categoryId} no existe`);
    }

    return await this.productRepository.create(productName.trim(), categoryId);
  }

  async updateProductName(id: number, name: string) {
    // Validar nombre
    if (!name || name.trim().length === 0) {
      throw ErrorFactory.badRequest("El nombre del producto es requerido");
    }

    // Verificar que el producto existe
    const productExists = await this.productRepository.exists(id);
    if (!productExists) {
      throw ErrorFactory.notFound(`Producto con ID ${id} no encontrado`);
    }

    await this.productRepository.updateName(id, name.trim());
  }

  async updateProductCategory(id: number, categoryId: number) {
    // Verificar que el producto existe
    const productExists = await this.productRepository.exists(id);
    if (!productExists) {
      throw ErrorFactory.notFound(`Producto con ID ${id} no encontrado`);
    }

    // Verificar que la categoría existe
    const categoryExists = await this.categoryRepository.exists(categoryId);
    if (!categoryExists) {
      throw ErrorFactory.notFound(`Categoría con ID ${categoryId} no existe`);
    }

    await this.productRepository.updateCategory(id, categoryId);
  }

  async deleteProduct(id: number) {
    const productExists = await this.productRepository.exists(id);
    if (!productExists) {
      throw ErrorFactory.notFound(`Producto con ID ${id} no encontrado`);
    }

    await this.productRepository.delete(id);
  }

  async getProductCount() {
    return await this.productRepository.count();
  }

  async getProductCountByCategory(categoryId: number) {
    const categoryExists = await this.categoryRepository.exists(categoryId);
    if (!categoryExists) {
      throw ErrorFactory.notFound(`Categoría con ID ${categoryId} no existe`);
    }

    return await this.productRepository.countByCategory(categoryId);
  }

  // ==================== CATEGORY METHODS ====================

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
    // Validar nombre
    if (!categoryName || categoryName.trim().length === 0) {
      throw ErrorFactory.badRequest("El nombre de la categoría es requerido");
    }

    return await this.categoryRepository.create(categoryName.trim());
  }

  async updateCategoryName(id: number, name: string) {
    // Validar nombre
    if (!name || name.trim().length === 0) {
      throw ErrorFactory.badRequest("El nombre de la categoría es requerido");
    }

    // Verificar que la categoría existe
    const categoryExists = await this.categoryRepository.exists(id);
    if (!categoryExists) {
      throw ErrorFactory.notFound(`Categoría con ID ${id} no encontrada`);
    }

    await this.categoryRepository.updateName(id, name.trim());
  }

  async deleteCategory(id: number) {
    const categoryExists = await this.categoryRepository.exists(id);
    if (!categoryExists) {
      throw ErrorFactory.notFound(`Categoría con ID ${id} no encontrada`);
    }

    await this.categoryRepository.delete(id);
  }

  async getCategoryCount() {
    return await this.categoryRepository.count();
  }
}
