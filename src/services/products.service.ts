import { db } from "../db/db";

export class ProductService {
  static async getProductsCategory() {
    const conn = await db.getConnection();
    try {
      const [rows] = await db.query("SELECT * FROM categoria");
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
      const [rows] = await db.query(
        "SELECT producto.id, producto.nombre FROM producto INNER JOIN categoria ON categoria.id = producto.categoria_id WHERE categoria.nombre = ? ",
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
}
