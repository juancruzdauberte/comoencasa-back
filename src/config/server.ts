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
import {
  CategoryRepository,
  ProductRepository,
} from "../repositories/product.repository";
import { ProductController } from "../controllers/products.controller";
import { ProductService } from "../services/products.service";
import { productRouter } from "../routes/products.routes";
import { FinanceRepository } from "../repositories/finance.repository";
import { FinanceService } from "../services/finances.service";
import { FinanceController } from "../controllers/finances.controller";
import { OrderRepository } from "../repositories/order.repository";
import { OrderService } from "../services/orders.service";
import { OrderController } from "../controllers/orders.controller";

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

const productRepository = new ProductRepository();
const categoryRepository = new CategoryRepository();
const productService = new ProductService(
  productRepository,
  categoryRepository
);
const productController = new ProductController(productService);
const financeRepository = new FinanceRepository();
const financeService = new FinanceService(financeRepository);
const financeController = new FinanceController(financeService);
const orderRepository = new OrderRepository();
const orderService = new OrderService(orderRepository);
const orderController = new OrderController(orderService);

app.use(limiter);
app.use("/api/auth", authRoutes);
app.use("/api/products", authenticateRequest, productRouter(productController));
app.use("/api/orders", authenticateRequest, orderRouter(orderController));
app.use("/api/finances", authenticateRequest, financeRouter(financeController));

app.use(errorHandler);

export default app;
