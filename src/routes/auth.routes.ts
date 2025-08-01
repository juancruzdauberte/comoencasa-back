import { Router } from "express";
import passport from "passport";
import {
  failure,
  googleCallback,
  logOut,
  refreshToken,
} from "../controllers/auth.controller";
import { authenticateRequest } from "../middlewares/authenticateRequest";

const router = Router();

router.get(
  "/callback",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    failureRedirect: `/api/auth/failure`,
    failureMessage: true,
    session: false,
  }),
  googleCallback
);
router.post("/logout", authenticateRequest, logOut);
router.post("/refresh", refreshToken);
router.get("/failure", authenticateRequest, failure);

export default router;
