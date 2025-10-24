import { CategoryResponseDTO, ProductResponseDTO } from "../dtos/product.dto";
import { IBaseRepository } from "./repository.interface";

/**
 * Interface para el repositorio de productos
 * Maneja todas las operaciones relacionadas con productos
 */
export interface IProductRepository extends IBaseRepository {
  /**
   * Obtiene todos los productos con información de categoría
   * @returns Array de productos con sus categorías
   */
  findAll(): Promise<ProductResponseDTO[]>;

  /**
   * Busca un producto por su ID
   * @param id ID del producto
   * @returns Producto encontrado o null si no existe
   */
  findById(id: number): Promise<ProductResponseDTO | null>;

  /**
   * Obtiene productos filtrados por categoría
   * @param categoryId ID de la categoría
   * @returns Array de productos de la categoría
   */
  findByCategory(categoryId: string): Promise<ProductResponseDTO[]>;

  /**
   * Busca productos por nombre (búsqueda parcial)
   * @param name Nombre o parte del nombre del producto
   * @returns Array de productos que coinciden
   */
  findByName(name: string): Promise<ProductResponseDTO[]>;

  /**
   * Crea un nuevo producto
   * @param name Nombre del producto
   * @param categoryId ID de la categoría
   * @returns ID del producto creado
   */
  create(name: string, categoryId: number): Promise<void>;

  /**
   * Actualiza el nombre de un producto
   * @param id ID del producto
   * @param name Nuevo nombre
   */
  updateName(id: number, name: string): Promise<void>;

  /**
   * Actualiza la categoría de un producto
   * @param id ID del producto
   * @param categoryId Nuevo ID de categoría
   */
  updateCategory(id: number, categoryId: number): Promise<void>;

  /**
   * Elimina un producto
   * @param id ID del producto
   */
  delete(id: number): Promise<void>;

  /**
   * Verifica si un producto existe
   * @param id ID del producto
   * @returns true si existe
   */
  exists(id: number): Promise<boolean>;

  /**
   * Verifica si un producto existe por nombre
   * @param name Nombre del producto
   * @returns true si existe
   */
  existsByName(name: string): Promise<boolean>;

  /**
   * Cuenta la cantidad de productos por categoría
   * @param categoryId ID de la categoría
   * @returns Número de productos
   */
  countByCategory(categoryId: number): Promise<number>;

  /**
   * Obtiene el total de productos
   * @returns Número total de productos
   */
  count(): Promise<number>;
}

/**
 * Interface para el repositorio de categorías
 * Maneja todas las operaciones relacionadas con categorías de productos
 */
export interface ICategoryRepository extends IBaseRepository {
  /**
   * Obtiene todas las categorías
   * @returns Array de categorías
   */
  findAll(): Promise<CategoryResponseDTO[]>;

  /**
   * Busca una categoría por su ID
   * @param id ID de la categoría
   * @returns Categoría encontrada o null si no existe
   */
  findById(id: number): Promise<CategoryResponseDTO | null>;

  /**
   * Busca una categoría por nombre
   * @param name Nombre de la categoría
   * @returns Categoría encontrada o null si no existe
   */
  findByName(name: string): Promise<CategoryResponseDTO | null>;

  /**
   * Crea una nueva categoría
   * @param name Nombre de la categoría
   * @returns ID de la categoría creada
   */
  create(name: string): Promise<void>;

  /**
   * Actualiza el nombre de una categoría
   * @param id ID de la categoría
   * @param name Nuevo nombre
   */
  updateName(id: number, name: string): Promise<void>;

  /**
   * Elimina una categoría
   * @param id ID de la categoría
   */
  delete(id: number): Promise<void>;

  /**
   * Verifica si una categoría existe
   * @param id ID de la categoría
   * @returns true si existe
   */
  exists(id: number): Promise<boolean>;

  /**
   * Verifica si una categoría existe por nombre
   * @param name Nombre de la categoría
   * @returns true si existe
   */
  existsByName(name: string): Promise<boolean>;

  /**
   * Cuenta la cantidad de categorías
   * @returns Número total de categorías
   */
  count(): Promise<number>;
}
