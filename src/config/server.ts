import express from "express";
import cors from "cors";
import config from "../config/config";
import { orderRouter } from "../routes/orders.routes";
import authRoutes from "../routes/auth.routes";
import { financeRouter } from "../routes/finances.routes";
import { errorHandler } from "../middlewares/errorHandler";
import { configurePassport } from "../config/passport";
import passport from "passport";
import { authenticateRequest } from "../middlewares/authenticateRequest";
import cookieParser from "cookie-parser";
import compression from "compression";
import { setupSwagger } from "../config/swagger";
import helmet from "helmet";
import { limiter } from "./limiter";
import responseTime from "response-time";
import { productRouter } from "../routes/products.routes";
import { DIContainer } from "../core/DIContainer";

const app = express();
app.set("trust proxy", 1);
app.use(responseTime());
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

app.use(limiter);
app.use("/api/auth", authRoutes);

app.use(
  "/api/products",
  authenticateRequest,
  productRouter(DIContainer.getProductController())
);
app.use(
  "/api/orders",
  authenticateRequest,
  orderRouter(DIContainer.getOrderController())
);
app.use(
  "/api/finances",
  authenticateRequest,
  financeRouter(DIContainer.getFinanceController())
);

app.use(errorHandler);

export default app;
