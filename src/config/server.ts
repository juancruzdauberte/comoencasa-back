import express from "express";
import cors from "cors";
import config from "../config/config";
import productsRoutes from "../routes/products.routes";
import ordersRoutes from "../routes/orders.routes";
import authRoutes from "../routes/auth.routes";
import financesRoutes from "../routes/finances.routes";
import { errorHandler } from "../middlewares/errorHandler";
import { configurePassport } from "../config/passport";
import passport from "passport";
import { authenticateRequest } from "../middlewares/authenticateRequest";
import cookieParser from "cookie-parser";
import compression from "compression";
import { setupSwagger } from "../config/swagger";
import helmet from "helmet";
import { limiter } from "./limiter";

const app = express();

app.use(helmet());
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
app.use(compression());

setupSwagger(app);

app.use("/api", limiter);
app.use("/api/auth", authRoutes);
app.use("/api/products", authenticateRequest, productsRoutes);
app.use("/api/orders", authenticateRequest, ordersRoutes);
app.use("/api/finances", authenticateRequest, financesRoutes);

app.use(errorHandler);

export default app;
