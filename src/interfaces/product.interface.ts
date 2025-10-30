import { ResultSetHeader } from "mysql2";
import { CategoryResponseDTO, ProductResponseDTO } from "../dtos/product.dto";
import { IBaseRepository } from "./repository.interface";
import { PoolConnection } from "mysql2/promise";

export interface IProductRepository extends IBaseRepository {
  findAll(): Promise<ProductResponseDTO[]>;

  findById(id: number): Promise<ProductResponseDTO | null>;

  findByCategory(categoryId: string): Promise<ProductResponseDTO[]>;

  findByName(name: string): Promise<ProductResponseDTO[]>;

  create(name: string, categoryId: number, conn: PoolConnection): Promise<void>;

  delete(id: number, conn: PoolConnection): Promise<void>;

  exists(id: number): Promise<boolean>;

  existsInCategory(name: string, categoryId: number): Promise<boolean>;
}

export interface ICategoryRepository extends IBaseRepository {
  findAll(): Promise<CategoryResponseDTO[]>;

  findById(id: number): Promise<CategoryResponseDTO | null>;

  findByName(name: string): Promise<CategoryResponseDTO | null>;

  create(name: string, conn: PoolConnection): Promise<void>;

  delete(id: number, conn: PoolConnection): Promise<void>;

  exists(id: number): Promise<boolean>;

  existsByName(name: string): Promise<boolean>;
}
