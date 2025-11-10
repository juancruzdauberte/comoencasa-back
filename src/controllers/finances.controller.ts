import { NextFunction, Request, Response } from "express";
import { FinanceService } from "../services/finances.service";
import { ErrorFactory } from "../errors/errorFactory";
import {
  MonthlyQueryParamsDTO,
  UpdateFinanceParamRequestDTO,
} from "../dtos/finance.dto";

export class FinanceController {
  constructor(private financeService: FinanceService) {}
  getAmountToday = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const amount = await this.financeService.getAmountToday();
      res.status(200).json(amount);
    } catch (error) {
      next(error);
    }
  };

  getTransferAmountToday = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const amount = await this.financeService.getTransferAmountToday();
      res.status(200).json(amount);
    } catch (error) {
      next(error);
    }
  };

  getCashAmountToday = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const amount = await this.financeService.getCashAmountToday();
      res.status(200).json(amount);
    } catch (error) {
      next(error);
    }
  };

  getAmountMonthly = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { month, year } = req.query as unknown as MonthlyQueryParamsDTO;

      if (!month || !year) {
        throw ErrorFactory.badRequest("Mes y año son requeridos");
      }

      const amount = await this.financeService.getAmountMonthly(
        Number(month),
        Number(year)
      );

      res.status(200).json(amount);
    } catch (error) {
      next(error);
    }
  };

  getTransferAmountMonthly = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { month, year } = req.query as unknown as MonthlyQueryParamsDTO;

      if (!month || !year) {
        throw ErrorFactory.badRequest("Mes y año son requeridos");
      }

      const amount = await this.financeService.getTransferAmountMonthly(
        Number(month),
        Number(year)
      );

      res.status(200).json(amount);
    } catch (error) {
      next(error);
    }
  };

  getCashAmountMonthly = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { month, year } = req.query as unknown as MonthlyQueryParamsDTO;

      if (!month || !year) {
        throw ErrorFactory.badRequest("Mes y año son requeridos");
      }

      const amount = await this.financeService.getCashAmountMonthly(
        Number(month),
        Number(year)
      );

      res.status(200).json(amount);
    } catch (error) {
      next(error);
    }
  };

  getDeliveryAmountToPay = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const amountToPay = await this.financeService.getDeliveryAmountToPay();
      res.status(200).json(amountToPay);
    } catch (error) {
      next(error);
    }
  };

  getValueFinanceParam = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { paramName } = req.query;

      if (!paramName) {
        throw ErrorFactory.badRequest("Nombre del parámetro es requerido");
      }

      const price = await this.financeService.getValueFinanceParam(
        String(paramName)
      );
      res.status(200).json(price);
    } catch (error) {
      next(error);
    }
  };

  updateValueFinanceParam = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { value, paramName } = req.body as UpdateFinanceParamRequestDTO;

      if (value === undefined || value === null || !paramName) {
        throw ErrorFactory.badRequest(
          "Valor y nombre del parámetro son requeridos"
        );
      }

      await this.financeService.updateValueFinanceParam(
        Number(value),
        paramName
      );

      res.status(200).json({
        message: "Parámetro financiero actualizado correctamente",
      });
    } catch (error) {
      next(error);
    }
  };

  getDeliveryCashAmount = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const total = await this.financeService.getDeliveryCashAmount();
      res.status(200).json(total);
    } catch (error) {
      next(error);
    }
  };
}
