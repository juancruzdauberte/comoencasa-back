import { db } from "../db/db";
import { ErrorFactory } from "../errors/errorFactory";
import { AppError } from "../errors/errors";

export class ProductService {
  static async getProductsCategory() {
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query("SELECT * FROM categoria");
      return rows;
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

  static async getProductsByCategory(category: string) {
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(
        "SELECT producto.id, producto.nombre, cat.nombre AS categoria FROM producto INNER JOIN categoria AS cat ON cat.id = producto.categoria_id WHERE cat.id = ? ",
        [category]
      );
      return rows;
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

  static async getProductById(id: number) {
    const conn = await db.getConnection();
    try {
      const [res] = await conn.query(
        "SELECT p.id, p.nombre,cat.id AS categoriaId, cat.nombre as categoria FROM producto AS p INNER JOIN categoria AS cat ON cat.id = p.categoria_id WHERE p.id = ?",
        [id]
      );
      return res;
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

  static async getAllProducts() {
    const conn = await db.getConnection();
    try {
      const [res] = await conn.query(
        "SELECT p.id, p.nombre, cat.id AS categoriaId, cat.nombre AS categoria FROM producto AS p INNER JOIN categoria AS cat ON cat.id = p.categoria_id"
      );
      return res;
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

  static async createProduct(productName: string, categoryId: number) {
    const conn = await db.getConnection();

    try {
      const [res]: any = await conn.query("CALL crear_producto(?, ?)", [
        productName,
        categoryId,
      ]);

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
      const [res]: any = await conn.query("CALL crear_categoria(?)", [
        categoryName,
      ]);
      if (res.length === 0) {
        throw ErrorFactory.badRequest("Error al crear la categoria");
      }
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
