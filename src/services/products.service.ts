import { db } from "../db/db";
import { ErrorFactory } from "../errors/errorFactory";
import { AppError } from "../errors/errors";

export class ProductService {
  static async getProductsCategory() {
    try {
      const [rows] = await db.query("SELECT * FROM categoria");
      return rows;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw ErrorFactory.internal("Error inesperado del sistema");
    }
  }

  static async getProductsByCategory(category: string) {
    try {
      const [rows] = await db.query(
        "SELECT producto.id, producto.nombre, cat.nombre AS categoria FROM producto INNER JOIN categoria AS cat ON cat.id = producto.categoria_id WHERE cat.id = ? ",
        [category]
      );
      return rows;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw ErrorFactory.internal("Error inesperado del sistema");
    }
  }

  static async getProductById(id: number) {
    try {
      const [res] = await db.query(
        "SELECT p.id, p.nombre,cat.id AS categoriaId, cat.nombre as categoria FROM producto AS p INNER JOIN categoria AS cat ON cat.id = p.categoria_id WHERE p.id = ?",
        [id]
      );
      return res;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw ErrorFactory.internal("Error inesperado del sistema");
    }
  }

  static async getAllProducts() {
    try {
      const [res] = await db.query(
        "SELECT p.id, p.nombre, cat.id AS categoriaId, cat.nombre AS categoria FROM producto AS p INNER JOIN categoria AS cat ON cat.id = p.categoria_id"
      );
      return res;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw ErrorFactory.internal("Error inesperado del sistema");
    }
  }

  static async createProduct(productName: string, categoryId: number) {
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      const [res]: any = await conn.query("CALL crear_producto(?, ?)", [
        productName,
        categoryId,
      ]);
      await conn.commit();

      return res[0];
    } catch (error) {
      await conn.rollback();
      if (error instanceof AppError) {
        throw error;
      }

      throw ErrorFactory.internal("Error inesperado del sistema");
    } finally {
      conn.release();
    }
  }

  static async deleteProduct(id: number) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [res]: any = await db.query(
        "DELETE FROM producto p WHERE p.id = ?",
        [id]
      );
      if (!res) {
        throw ErrorFactory.badRequest("Error al eliminar un producto");
      }
      await conn.commit();

      return res[0];
    } catch (error) {
      await conn.rollback();
      if (error instanceof AppError) {
        throw error;
      }

      throw ErrorFactory.internal("Error inesperado del sistema");
    } finally {
      conn.release();
    }
  }

  static async deleteCategory(id: number) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      const [res]: any = await db.query(
        "DELETE FROM categoria c WHERE c.id = ?",
        [id]
      );
      if (!res) {
        throw ErrorFactory.badRequest("Error al eliminar la categoria");
      }
      await conn.commit();

      return res[0];
    } catch (error) {
      await conn.rollback();
      if (error instanceof AppError) {
        throw error;
      }

      throw ErrorFactory.internal("Error inesperado del sistema");
    } finally {
      conn.release();
    }
  }

  static async createCategory(categoryName: string) {
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      const [res]: any = await conn.query("CALL crear_categoria(?)", [
        categoryName,
      ]);
      if (res.length === 0) {
        throw ErrorFactory.badRequest("Error al crear la categoria");
      }
      await conn.commit();

      return res[0];
    } catch (error) {
      await conn.rollback();
      if (error instanceof AppError) {
        throw error;
      }

      throw ErrorFactory.internal("Error inesperado del sistema");
    } finally {
      conn.release();
    }
  }
}
