import express from "express";
import cors from "cors";
import config from "./config/config";
import productsRoutes from "./routes/products.routes";
import ordersRoutes from "./routes/orders.routes";

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

app.use("/api/products", productsRoutes);
app.use("/api/orders", ordersRoutes);
