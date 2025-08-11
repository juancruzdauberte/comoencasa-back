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
