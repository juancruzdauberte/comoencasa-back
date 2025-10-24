import { NextFunction, Request, Response } from "express";
import { FinanceService } from "../services/finances.service";
import { ErrorFactory } from "../errors/errorFactory";
import {
  FinanceParamQueryDTO,
  MonthlyQueryParamsDTO,
  UpdateFinanceParamRequestDTO,
} from "../dtos/finance.dto";

export async function getAmountToday(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const amount = await FinanceService.getAmountToday();
    res.status(200).json(amount);
  } catch (error) {
    next(error);
  }
}

export async function getTransferAmountToday(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const amount = await FinanceService.getTransferAmountToday();
    res.status(200).json(amount);
  } catch (error) {
    next(error);
  }
}

export async function getCashAmountToday(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const amount = await FinanceService.getCashAmountToday();
    res.status(200).json(amount);
  } catch (error) {
    next(error);
  }
}

export async function getAmountMonthly(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { month, year } = req.query as unknown as MonthlyQueryParamsDTO;

    if (!month || !year) {
      throw ErrorFactory.badRequest("Mes y año son requeridos");
    }

    const amount = await FinanceService.getAmountMonthly(
      Number(month),
      Number(year)
    );

    res.status(200).json(amount);
  } catch (error) {
    next(error);
  }
}

export async function getTransferAmountMonthly(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { month, year } = req.query as unknown as MonthlyQueryParamsDTO;

    if (!month || !year) {
      throw ErrorFactory.badRequest("Mes y año son requeridos");
    }

    const amount = await FinanceService.getTransferAmountMonthly(
      Number(month),
      Number(year)
    );

    res.status(200).json(amount);
  } catch (error) {
    next(error);
  }
}

export async function getCashAmountMonthly(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { month, year } = req.query as unknown as MonthlyQueryParamsDTO;

    if (!month || !year) {
      throw ErrorFactory.badRequest("Mes y año son requeridos");
    }

    const amount = await FinanceService.getCashAmountMonthly(
      Number(month),
      Number(year)
    );

    res.status(200).json(amount);
  } catch (error) {
    next(error);
  }
}

export async function getDeliveryAmountToPay(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const amountToPay = await FinanceService.getDeliveryAmountToPay();
    res.status(200).json(amountToPay);
  } catch (error) {
    next(error);
  }
}

export async function getValueFinanceParam(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { paramName } = req.query;

    if (!paramName) {
      throw ErrorFactory.badRequest("Nombre del parámetro es requerido");
    }

    const price = await FinanceService.getValueFinanceParam(String(paramName));
    res.status(200).json(price);
  } catch (error) {
    next(error);
  }
}

export async function updateValueFinanceParam(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { value, paramName } = req.body as UpdateFinanceParamRequestDTO;

    if (value === undefined || value === null || !paramName) {
      throw ErrorFactory.badRequest(
        "Valor y nombre del parámetro son requeridos"
      );
    }

    await FinanceService.updateValueFinanceParam(Number(value), paramName);

    res.status(200).json({
      message: "Parámetro financiero actualizado correctamente",
    });
  } catch (error) {
    next(error);
  }
}

export async function getDeliveryCashAmount(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const total = await FinanceService.getDeliveryCashAmount();
    res.status(200).json(total);
  } catch (error) {
    next(error);
  }
}
