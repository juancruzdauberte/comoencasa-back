import { PoolConnection, ResultSetHeader } from "mysql2/promise";
import { OrderResponseDTO, ProductCreateOrderDTO } from "../dtos/order.dto";
import {
  IBaseRepository,
  StoredProcedureResultWithTotal,
} from "./repository.interface";

export interface IOrderRepository extends IBaseRepository {
  findAll(
    filter: string | null,
    limit: number,
    offset: number
  ): Promise<StoredProcedureResultWithTotal<OrderResponseDTO>>;

  findById(id: number): Promise<OrderResponseDTO | null>;

  create(
    data: {
      address: string;
      deliveryTime: string;
      observation: string;
      clientSurname: string;
    },
    conn: PoolConnection
  ): Promise<number>;

  addProduct(
    orderId: number,
    productId: number,
    quantity: number,
    conn: PoolConnection
  ): Promise<void>;

  insertPaymentDate(
    orderId: number,
    conn: PoolConnection
  ): Promise<ResultSetHeader>;

  createOrderPayment(
    orderId: number,
    payMethod: string,
    amount: number,
    conn: PoolConnection
  ): Promise<void>;

  deleteProduct(
    orderId: number,
    productId: number,
    conn: PoolConnection
  ): Promise<ResultSetHeader>;

  createOrderDetails(
    orderId: number,
    products: ProductCreateOrderDTO[],
    conn: PoolConnection
  ): Promise<void>;

  updateOrderPayment(
    orderId: number,
    payMethond: string,
    amount: number,
    conn: PoolConnection
  ): Promise<void>;
  delete(orderId: number, conn: PoolConnection): Promise<ResultSetHeader>;

  update(
    orderId: number,
    data: {
      address: string;
      deliveryTime: string;
      observation: string;
      state: string;
      clientSurname: string;
    },
    conn: PoolConnection
  ): Promise<void>;

  updateProductQuantity(
    orderId: number,
    productId: number,
    quantity: number,
    conn: PoolConnection
  ): Promise<void>;

  orderExists(orderId: number, conn?: PoolConnection): Promise<boolean>;

  productExists(productId: number, conn?: PoolConnection): Promise<boolean>;

  productExistsInOrder(
    orderId: number,
    productId: number,
    conn?: PoolConnection
  ): Promise<boolean>;
}
