import { Router } from "express";
import { getClient } from "../controllers/clients.controller";

const router = Router();

router.get("/:tel", getClient);

export default router;
