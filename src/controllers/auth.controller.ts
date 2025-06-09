import passport from "passport";
import { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "../errors/errors";
import config from "../config/config";

export function googleCallback(
  req: Request,
  res: Response,
  next: NextFunction
) {
  passport.authenticate("google", { session: false }, (err, data, info) => {
    if (err) return next(err);
    if (!data) {
      res.redirect(`${config.CLIENT_URL}/unauthorized`);
      throw new UnauthorizedError("No autorizado");
    }

    const { accessToken } = data;

    res.cookie("token", accessToken, {
      httpOnly: true,
      secure: true,
      maxAge: 1000 * 60 * 60 * 24 * 3,
      sameSite: "lax",
      path: "/",
    });

    res.redirect(`${config.CLIENT_URL}`);
  })(req, res, next);
}

export async function status(req: Request, res: Response, next: NextFunction) {
  const user = req.user;
  try {
    res.status(200).json({ auth: true, user });
  } catch (error) {
    next(error);
  }
}

export async function logOut(req: Request, res: Response, next: NextFunction) {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
    });
    res.redirect(`${config.CLIENT_URL}/login`);
  } catch (error) {
    next(error);
  }
}
