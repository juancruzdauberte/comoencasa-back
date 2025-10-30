import rateLimit from "express-rate-limit";
import { secureLogger } from "./logger";

export const limiter = rateLimit({
  windowMs: 3 * 60 * 1000,
  max: 150,
  message: "Demasiadas peticiones, intenta más tarde",
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    secureLogger.error(
      `Rate limit excedido para ${req.ip}. Petición bloqueada: ${req.method} ${req.originalUrl}`
    );
    res.status(options.statusCode).send(options.message);
  },
});
