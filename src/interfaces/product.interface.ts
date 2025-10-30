import { CategoryResponseDTO, ProductResponseDTO } from "../dtos/product.dto";
import { IBaseRepository } from "./repository.interface";

export interface IProductRepository extends IBaseRepository {
  findAll(): Promise<ProductResponseDTO[]>;

  findById(id: number): Promise<ProductResponseDTO | null>;

  findByCategory(categoryId: string): Promise<ProductResponseDTO[]>;

  findByName(name: string): Promise<ProductResponseDTO[]>;

  create(name: string, categoryId: number): Promise<void>;

  updateName(id: number, name: string): Promise<void>;

  updateCategory(id: number, categoryId: number): Promise<void>;

  delete(id: number): Promise<void>;

  exists(id: number): Promise<boolean>;

  existsByName(name: string): Promise<boolean>;

  countByCategory(categoryId: number): Promise<number>;
}

export interface ICategoryRepository extends IBaseRepository {
  findAll(): Promise<CategoryResponseDTO[]>;

  findById(id: number): Promise<CategoryResponseDTO | null>;

  findByName(name: string): Promise<CategoryResponseDTO | null>;

  create(name: string): Promise<void>;

  updateName(id: number, name: string): Promise<void>;

  delete(id: number): Promise<void>;

  exists(id: number): Promise<boolean>;

  existsByName(name: string): Promise<boolean>;
}
