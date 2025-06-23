import { db } from "../db/db";

export class ProductService {
  static async getProductsCategory() {
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query("SELECT * FROM categoria");
      return rows;
    } catch (error) {
      console.error(error);
      await conn.rollback();
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
      console.error(error);
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
      console.error(error);
      await conn.rollback();
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
      console.error(error);
      await conn.rollback();
    } finally {
      conn.release();
    }
  }
}
