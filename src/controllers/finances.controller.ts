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
