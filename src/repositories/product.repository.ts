import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { db } from "../db/db";
import { CategoryResponseDTO, ProductResponseDTO } from "../dtos/product.dto";
import { ErrorFactory } from "../errors/errorFactory";
import { AppError } from "../errors/errors";
import {
  ICategoryRepository,
  IProductRepository,
} from "../interfaces/product.interface";
import { secureLogger } from "../config/logger";

export class ProductRepository implements IProductRepository {
  async getConnection(): Promise<PoolConnection> {
    return await db.getConnection();
  }

  async findAll(): Promise<ProductResponseDTO[]> {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        `SELECT p.id, p.nombre, cat.id AS categoriaId, cat.nombre AS categoria 
         FROM producto AS p 
         INNER JOIN categoria AS cat ON cat.id = p.categoria_id
         ORDER BY cat.nombre, p.nombre`,
      );

      return rows as ProductResponseDTO[];
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      secureLogger.error("Error fetching all products", error);
      throw ErrorFactory.internal("Error al obtener los productos");
    }
  }

  async findById(id: number): Promise<ProductResponseDTO | null> {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        `SELECT p.id, p.nombre, cat.id AS categoriaId, cat.nombre AS categoria 
         FROM producto AS p 
         INNER JOIN categoria AS cat ON cat.id = p.categoria_id 
         WHERE p.id = ?
         LIMIT 1`,
        [id],
      );

      if (rows.length === 0) {
        return null;
      }

      return rows[0] as ProductResponseDTO;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      secureLogger.error("Error fetching product by ID", error, { id });
      throw ErrorFactory.internal("Error al obtener el producto");
    }
  }

  async findByCategory(categoryId: string): Promise<ProductResponseDTO[]> {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        `SELECT p.id, p.nombre, cat.id AS categoriaId, cat.nombre AS categoria 
         FROM producto AS p
         INNER JOIN categoria AS cat ON cat.id = p.categoria_id 
         WHERE cat.id = ?
         ORDER BY p.nombre`,
        [categoryId],
      );

      return rows as ProductResponseDTO[];
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      secureLogger.error("Error fetching products by category", error, {
        categoryId,
      });
      throw ErrorFactory.internal("Error al obtener productos por categoría");
    }
  }

  async findByName(name: string): Promise<ProductResponseDTO[]> {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        `SELECT p.id, p.nombre, cat.id AS categoriaId, cat.nombre AS categoria 
         FROM producto AS p 
         INNER JOIN categoria AS cat ON cat.id = p.categoria_id 
         WHERE p.nombre LIKE ?
         ORDER BY p.nombre`,
        [`%${name}%`],
      );

      return rows as ProductResponseDTO[];
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      secureLogger.error("Error searching products by name", error, { name });
      throw ErrorFactory.internal("Error al buscar productos por nombre");
    }
  }

  async create(
    name: string,
    categoryId: number,
    conn: PoolConnection,
  ): Promise<void> {
    await conn.query(
      "INSERT INTO producto(nombre, categoria_id) VALUES (?, ?)",
      [name, categoryId],
    );
  }

  async delete(id: number, conn: PoolConnection): Promise<void> {
    await conn.query<ResultSetHeader>("DELETE FROM producto WHERE id = ?", [
      id,
    ]);
  }

  async exists(id: number): Promise<boolean> {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        "SELECT id FROM producto WHERE id = ? LIMIT 1",
        [id],
      );

      return rows.length > 0;
    } catch (error) {
      secureLogger.error("Error checking product existence", error, { id });
      throw ErrorFactory.internal("Error al verificar existencia del producto");
    }
  }

  async existsInCategory(name: string, categoryId: number): Promise<boolean> {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        "SELECT id FROM producto WHERE nombre = ? AND categoria_id = ? LIMIT 1",
        [name, categoryId],
      );

      return rows.length > 0;
    } catch (error) {
      secureLogger.error(
        "Error checking product existence in category",
        error,
        {
          name,
        },
      );
      throw ErrorFactory.internal(
        "Error al verificar existencia del producto en la categoria",
      );
    }
  }
}

export class CategoryRepository implements ICategoryRepository {
  async getConnection(): Promise<PoolConnection> {
    return await db.getConnection();
  }

  async findAll(): Promise<CategoryResponseDTO[]> {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        "SELECT * FROM categoria ORDER BY nombre",
      );

      return rows as CategoryResponseDTO[];
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      secureLogger.error("Error fetching all categories", error);
      throw ErrorFactory.internal("Error al obtener las categorías");
    }
  }

  async findById(id: number): Promise<CategoryResponseDTO | null> {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        "SELECT * FROM categoria WHERE id = ? LIMIT 1",
        [id],
      );

      if (rows.length === 0) {
        return null;
      }

      return rows[0] as CategoryResponseDTO;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      secureLogger.error("Error fetching category by ID", error, { id });
      throw ErrorFactory.internal("Error al obtener la categoría");
    }
  }

  async findByName(name: string): Promise<CategoryResponseDTO | null> {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        "SELECT * FROM categoria WHERE nombre = ? LIMIT 1",
        [name],
      );

      if (rows.length === 0) {
        return null;
      }

      return rows[0] as CategoryResponseDTO;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      secureLogger.error("Error fetching category by name", error, { name });
      throw ErrorFactory.internal("Error al obtener la categoría por nombre");
    }
  }

  async create(name: string, conn: PoolConnection): Promise<void> {
    await conn.query("INSERT INTO categoria(nombre) VALUES (?)", [name]);
  }

  async delete(id: number, conn: PoolConnection): Promise<void> {
    await conn.query<ResultSetHeader>("DELETE FROM categoria WHERE id = ?", [
      id,
    ]);
  }

  async exists(id: number): Promise<boolean> {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        "SELECT id FROM categoria WHERE id = ? LIMIT 1",
        [id],
      );

      return rows.length > 0;
    } catch (error) {
      secureLogger.error("Error checking category existence", error, { id });
      throw ErrorFactory.internal(
        "Error al verificar existencia de la categoría",
      );
    }
  }

  async existsByName(name: string): Promise<boolean> {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        "SELECT id FROM categoria WHERE nombre = ? LIMIT 1",
        [name],
      );

      return rows.length > 0;
    } catch (error) {
      secureLogger.error("Error checking category existence by name", error, {
        name,
      });
      throw ErrorFactory.internal(
        "Error al verificar existencia de la categoría",
      );
    }
  }
}
