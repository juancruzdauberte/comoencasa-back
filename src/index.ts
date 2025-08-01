import express from "express";
import cors from "cors";
import config from "./config/config";
import productsRoutes from "./routes/products.routes";
import ordersRoutes from "./routes/orders.routes";
import authRoutes from "./routes/auth.routes";
import { errorHandler } from "./middlewares/errorHandler";
import { configurePassport } from "./config/passport";
import passport from "passport";
import { authenticateRequest } from "./middlewares/authenticateRequest";
import cookieParser from "cookie-parser";
import compression from "compression"

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: config.CLIENT_URL,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(passport.initialize());
configurePassport();

app.use(compression())
app.listen(config.PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${config.PORT}`);
});

app.use("/api/products", authenticateRequest, productsRoutes);
app.use("/api/orders", authenticateRequest, ordersRoutes);
app.use("/api/auth", authRoutes);

app.use(errorHandler);
