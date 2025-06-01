import { db } from "../db/db";

export class ProductService {
  static async getProductsCategory() {
    const [rows] = await db.query("SELECT * FROM categoria");
    return rows;
  }

  static async getProductsByCategory(category: string) {
    const [rows] = await db.query(
      "SELECT producto.id, producto.nombre FROM producto INNER JOIN categoria ON categoria.id = producto.categoria_id WHERE categoria.nombre = ? ",
      [category]
    );
    return rows;
  }
}
