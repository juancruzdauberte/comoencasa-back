import express from "express";
import cors from "cors";
import config from "./config/config";
import { db } from "./db/db";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: config.CLIENT_URL,
    credentials: true,
  })
);

app.listen(config.PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${config.PORT}`);
});

app.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT producto.nombre FROM producto JOIN categoria ON categoria.id = producto.categoria_id WHERE categoria.nombre = 'tortilla'"
    );
    res.json(rows);
  } catch (error) {
    console.error("Error al consultar productos:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});
