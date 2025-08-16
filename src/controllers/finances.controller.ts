import { NextFunction, Request, Response } from "express";
import { FinanceClass } from "../services/finances.service";

export async function getAmountToday(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const amount = await FinanceClass.getAmountToday();
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
    const amount = await FinanceClass.getTransferAmountToday();
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
    const amount = await FinanceClass.getCashAmountToday();
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
  const { month, year } = req.query;
  try {
    const amount = await FinanceClass.getAmountMonthly(
      Number(month),
      Number(year)
    );
    res.status(200).json(amount);
  } catch (error) {
    next(error);
  }
}

export async function getTrasnferAmountMonthly(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { month, year } = req.query;
  try {
    const amount = await FinanceClass.getTransferAmountMonthly(
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
  const { month, year } = req.query;
  try {
    const amount = await FinanceClass.getCashAmountMonthly(
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
    const amountToPay = await FinanceClass.getDeliveryAmountToPay();
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
    const price = await FinanceClass.getValueFinanceParam(String(paramName));
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
    const { value, paramName } = req.body;
    await FinanceClass.updateValueFinanceParam(Number(value), paramName);
    res
      .status(200)
      .json({ message: "Parametro financiero actualizado correctamente" });
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
    const total = await FinanceClass.getDeliveryCashAmount();
    res.status(200).json(total);
  } catch (error) {
    next(error);
  }
}
