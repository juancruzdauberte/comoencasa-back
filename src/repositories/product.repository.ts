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
         ORDER BY cat.nombre, p.nombre`
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
        [id]
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
        [categoryId]
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
        [`%${name}%`]
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

  async create(name: string, categoryId: number): Promise<void> {
    const conn = await this.getConnection();

    try {
      await conn.beginTransaction();

      // Verificar si ya existe un producto con ese nombre en la misma categoría
      const [existing] = await conn.query<RowDataPacket[]>(
        "SELECT id FROM producto WHERE nombre = ? AND categoria_id = ? LIMIT 1",
        [name, categoryId]
      );

      if (existing.length > 0) {
        throw ErrorFactory.badRequest(
          `Ya existe un producto con el nombre "${name}" en esta categoría`
        );
      }

      await conn.query("CALL crear_producto(?, ?)", [name, categoryId]);

      await conn.commit();

      secureLogger.info("Product created successfully", {
        name,
        categoryId,
      });
    } catch (error) {
      await conn.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      secureLogger.error("Error creating product", error, { name, categoryId });
      throw ErrorFactory.internal("Error al crear el producto");
    } finally {
      conn.release();
    }
  }

  async updateName(id: number, name: string): Promise<void> {
    const conn = await this.getConnection();

    try {
      await conn.beginTransaction();

      // Verificar que no exista otro producto con el mismo nombre en la misma categoría
      const [existing] = await conn.query<RowDataPacket[]>(
        `SELECT id FROM producto 
         WHERE nombre = ? 
         AND categoria_id = (SELECT categoria_id FROM producto WHERE id = ?)
         AND id != ?
         LIMIT 1`,
        [name, id, id]
      );

      if (existing.length > 0) {
        throw ErrorFactory.badRequest(
          `Ya existe otro producto con el nombre "${name}" en esta categoría`
        );
      }

      const [result] = await conn.query<ResultSetHeader>(
        "UPDATE producto SET nombre = ? WHERE id = ?",
        [name, id]
      );

      if (result.affectedRows === 0) {
        throw ErrorFactory.notFound(`Producto con ID ${id} no encontrado`);
      }

      await conn.commit();

      secureLogger.info("Product name updated successfully", { id, name });
    } catch (error) {
      await conn.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      secureLogger.error("Error updating product name", error, { id, name });
      throw ErrorFactory.internal("Error al actualizar el nombre del producto");
    } finally {
      conn.release();
    }
  }

  async updateCategory(id: number, categoryId: number): Promise<void> {
    const conn = await this.getConnection();

    try {
      await conn.beginTransaction();

      // Verificar que no exista otro producto con el mismo nombre en la nueva categoría
      const [existing] = await conn.query<RowDataPacket[]>(
        `SELECT p2.id FROM producto p1
         INNER JOIN producto p2 ON p1.nombre = p2.nombre
         WHERE p1.id = ? AND p2.categoria_id = ? AND p2.id != ?
         LIMIT 1`,
        [id, categoryId, id]
      );

      if (existing.length > 0) {
        throw ErrorFactory.badRequest(
          "Ya existe un producto con el mismo nombre en la categoría destino"
        );
      }

      const [result] = await conn.query<ResultSetHeader>(
        "UPDATE producto SET categoria_id = ? WHERE id = ?",
        [categoryId, id]
      );

      if (result.affectedRows === 0) {
        throw ErrorFactory.notFound(`Producto con ID ${id} no encontrado`);
      }

      await conn.commit();

      secureLogger.info("Product category updated successfully", {
        id,
        categoryId,
      });
    } catch (error) {
      await conn.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      secureLogger.error("Error updating product category", error, {
        id,
        categoryId,
      });
      throw ErrorFactory.internal(
        "Error al actualizar la categoría del producto"
      );
    } finally {
      conn.release();
    }
  }

  async delete(id: number): Promise<void> {
    const conn = await this.getConnection();

    try {
      await conn.beginTransaction();

      const [result] = await conn.query<ResultSetHeader>(
        "DELETE FROM producto WHERE id = ?",
        [id]
      );

      if (result.affectedRows === 0) {
        throw ErrorFactory.notFound(`Producto con ID ${id} no encontrado`);
      }

      await conn.commit();

      secureLogger.info("Product deleted successfully", { id });
    } catch (error) {
      await conn.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      secureLogger.error("Error deleting product", error, { id });
      throw ErrorFactory.internal("Error al eliminar el producto");
    } finally {
      conn.release();
    }
  }

  async exists(id: number): Promise<boolean> {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        "SELECT id FROM producto WHERE id = ? LIMIT 1",
        [id]
      );

      return rows.length > 0;
    } catch (error) {
      secureLogger.error("Error checking product existence", error, { id });
      throw ErrorFactory.internal("Error al verificar existencia del producto");
    }
  }

  async existsByName(name: string): Promise<boolean> {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        "SELECT id FROM producto WHERE nombre = ? LIMIT 1",
        [name]
      );

      return rows.length > 0;
    } catch (error) {
      secureLogger.error("Error checking product existence by name", error, {
        name,
      });
      throw ErrorFactory.internal("Error al verificar existencia del producto");
    }
  }

  async countByCategory(categoryId: number): Promise<number> {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        "SELECT COUNT(*) as total FROM producto WHERE categoria_id = ?",
        [categoryId]
      );

      return rows[0].total as number;
    } catch (error) {
      secureLogger.error("Error counting products by category", error, {
        categoryId,
      });
      throw ErrorFactory.internal("Error al contar productos por categoría");
    }
  }

  async count(): Promise<number> {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        "SELECT COUNT(*) as total FROM producto"
      );

      return rows[0].total as number;
    } catch (error) {
      secureLogger.error("Error counting products", error);
      throw ErrorFactory.internal("Error al contar productos");
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
        "SELECT * FROM categoria ORDER BY nombre"
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
        [id]
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
        [name]
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

  async create(name: string): Promise<void> {
    const conn = await this.getConnection();

    try {
      await conn.beginTransaction();

      // Verificar si ya existe una categoría con ese nombre
      const [existing] = await conn.query<RowDataPacket[]>(
        "SELECT id FROM categoria WHERE nombre = ? LIMIT 1",
        [name]
      );

      if (existing.length > 0) {
        throw ErrorFactory.badRequest(
          `Ya existe una categoría con el nombre "${name}"`
        );
      }

      await conn.query("CALL crear_categoria(?)", [name]);

      await conn.commit();

      secureLogger.info("Category created successfully", { name });
    } catch (error) {
      await conn.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      secureLogger.error("Error creating category", error, { name });
      throw ErrorFactory.internal("Error al crear la categoría");
    } finally {
      conn.release();
    }
  }

  async updateName(id: number, name: string): Promise<void> {
    const conn = await this.getConnection();

    try {
      await conn.beginTransaction();

      // Verificar que no exista otra categoría con el mismo nombre
      const [existing] = await conn.query<RowDataPacket[]>(
        "SELECT id FROM categoria WHERE nombre = ? AND id != ? LIMIT 1",
        [name, id]
      );

      if (existing.length > 0) {
        throw ErrorFactory.badRequest(
          `Ya existe otra categoría con el nombre "${name}"`
        );
      }

      const [result] = await conn.query<ResultSetHeader>(
        "UPDATE categoria SET nombre = ? WHERE id = ?",
        [name, id]
      );

      if (result.affectedRows === 0) {
        throw ErrorFactory.notFound(`Categoría con ID ${id} no encontrada`);
      }

      await conn.commit();

      secureLogger.info("Category name updated successfully", { id, name });
    } catch (error) {
      await conn.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      secureLogger.error("Error updating category name", error, { id, name });
      throw ErrorFactory.internal(
        "Error al actualizar el nombre de la categoría"
      );
    } finally {
      conn.release();
    }
  }

  async delete(id: number): Promise<void> {
    const conn = await this.getConnection();

    try {
      await conn.beginTransaction();

      // Verificar si hay productos asociados a esta categoría
      const [products] = await conn.query<RowDataPacket[]>(
        "SELECT COUNT(*) as total FROM producto WHERE categoria_id = ?",
        [id]
      );

      if (products[0].total > 0) {
        throw ErrorFactory.badRequest(
          `No se puede eliminar la categoría porque tiene ${products[0].total} producto(s) asociado(s)`
        );
      }

      const [result] = await conn.query<ResultSetHeader>(
        "DELETE FROM categoria WHERE id = ?",
        [id]
      );

      if (result.affectedRows === 0) {
        throw ErrorFactory.notFound(`Categoría con ID ${id} no encontrada`);
      }

      await conn.commit();

      secureLogger.info("Category deleted successfully", { id });
    } catch (error) {
      await conn.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      secureLogger.error("Error deleting category", error, { id });
      throw ErrorFactory.internal("Error al eliminar la categoría");
    } finally {
      conn.release();
    }
  }

  async exists(id: number): Promise<boolean> {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        "SELECT id FROM categoria WHERE id = ? LIMIT 1",
        [id]
      );

      return rows.length > 0;
    } catch (error) {
      secureLogger.error("Error checking category existence", error, { id });
      throw ErrorFactory.internal(
        "Error al verificar existencia de la categoría"
      );
    }
  }

  async existsByName(name: string): Promise<boolean> {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        "SELECT id FROM categoria WHERE nombre = ? LIMIT 1",
        [name]
      );

      return rows.length > 0;
    } catch (error) {
      secureLogger.error("Error checking category existence by name", error, {
        name,
      });
      throw ErrorFactory.internal(
        "Error al verificar existencia de la categoría"
      );
    }
  }

  async count(): Promise<number> {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        "SELECT COUNT(*) as total FROM categoria"
      );

      return rows[0].total as number;
    } catch (error) {
      secureLogger.error("Error counting categories", error);
      throw ErrorFactory.internal("Error al contar categorías");
    }
  }
}
