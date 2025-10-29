import { PoolConnection } from "mysql2/promise";
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
    address: string,
    deliveryTime: string,
    observation: string,
    products: ProductCreateOrderDTO[],
    payMethod: string,
    amount: number,
    clientSurname: string
  ): Promise<number>;

  addProduct(
    orderId: number,
    productId: number,
    quantity: number
  ): Promise<void>;

  insertPaymentDate(orderId: number): Promise<void>;

  deleteProduct(orderId: number, productId: number): Promise<void>;

  delete(orderId: number): Promise<void>;

  update(
    orderId: string,
    address: string,
    deliveryTime: string,
    observation: string,
    state: string,
    payMethod: string,
    amount: number,
    products: ProductCreateOrderDTO[],
    clientSurname: string
  ): Promise<void>;

  updateProductQuantity(
    orderId: number,
    productId: number,
    quantity: number
  ): Promise<void>;

  orderExists(orderId: number, conn?: PoolConnection): Promise<boolean>;

  productExists(productId: number, conn?: PoolConnection): Promise<boolean>;

  productExistsInOrder(
    orderId: number,
    productId: number,
    conn?: PoolConnection
  ): Promise<boolean>;
}
