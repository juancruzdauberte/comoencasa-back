import { Router } from "express";
import passport from "passport";
import { googleCallback, logOut, status } from "../controllers/auth.controller";
import { authenticateRequest } from "../middlewares/authtenticateRequest";

const router = Router();

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get("/google/callback", googleCallback);
router.get("/status", authenticateRequest, status);
router.post("/logout", authenticateRequest, logOut);

export default router;
