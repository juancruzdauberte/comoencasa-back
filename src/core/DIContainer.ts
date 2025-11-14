import { FinanceController } from "../controllers/finances.controller";
import { OrderController } from "../controllers/orders.controller";
import { ProductController } from "../controllers/products.controller";
import { FinanceRepository } from "../repositories/finance.repository";
import { OrderRepository } from "../repositories/order.repository";
import {
  CategoryRepository,
  ProductRepository,
} from "../repositories/product.repository";
import { UserRepository } from "../repositories/user.repository";
import { FinanceService } from "../services/finances.service";
import { OrderService } from "../services/orders.service";
import { ProductService } from "../services/products.service";
import UserService from "../services/user.service";

export class DIContainer {
  private static categoryRepository: CategoryRepository;
  private static productRepository: ProductRepository;
  private static orderRepository: OrderRepository;
  private static userRepository: UserRepository;
  private static financeRepository: FinanceRepository;

  private static productService: ProductService;
  private static orderService: OrderService;
  private static userService: UserService;
  private static financeService: FinanceService;

  private static productController: ProductController;
  private static orderController: OrderController;
  private static financeController: FinanceController;

  static getCategoryRepository(): CategoryRepository {
    if (!this.categoryRepository)
      this.categoryRepository = new CategoryRepository();
    return this.categoryRepository;
  }

  static getProductRepository(): ProductRepository {
    if (!this.productRepository)
      this.productRepository = new ProductRepository();
    return this.productRepository;
  }

  static getOrderRepository(): OrderRepository {
    if (!this.orderRepository) this.orderRepository = new OrderRepository();
    return this.orderRepository;
  }

  static getUserRepository(): UserRepository {
    if (!this.userRepository) this.userRepository = new UserRepository();
    return this.userRepository;
  }

  static getFinanceRepository(): FinanceRepository {
    if (!this.financeRepository)
      this.financeRepository = new FinanceRepository();
    return this.financeRepository;
  }

  static getProductService(): ProductService {
    if (!this.productService)
      this.productService = new ProductService(
        this.getProductRepository(),
        this.getCategoryRepository()
      );
    return this.productService;
  }

  static getOrderService(): OrderService {
    if (!this.orderService)
      this.orderService = new OrderService(this.getOrderRepository());
    return this.orderService;
  }

  static getFinanceService(): FinanceService {
    if (!this.financeService)
      this.financeService = new FinanceService(this.getFinanceRepository());
    return this.financeService;
  }

  static getUserService(): UserService {
    if (!this.userService)
      this.userService = new UserService(this.getUserRepository());
    return this.userService;
  }

  static getProductController(): ProductController {
    if (!this.productController)
      this.productController = new ProductController(this.getProductService());
    return this.productController;
  }

  static getOrderController(): OrderController {
    if (!this.orderController)
      this.orderController = new OrderController(this.getOrderService());
    return this.orderController;
  }

  static getFinanceController(): FinanceController {
    if (!this.financeController)
      this.financeController = new FinanceController(this.getFinanceService());
    return this.financeController;
  }
}
