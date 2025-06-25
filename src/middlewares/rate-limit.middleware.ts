import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";

import { ApiError } from "../utils";

export const rateLimitMiddleware = rateLimit({
  windowMs: 60 * 1000,
  max: 100, // 100 requests for IP
  handler: (req: Request, res: Response, next: NextFunction) => {
    const error = new ApiError(
      429,
      "RATE_LIMIT_EXCEEDED",
      "Demasiadas solicitudes, por favor intenta de nuevo más tarde.",
      "Límite de 100 solicitudes por minuto por IP excedido."
    );
    next(error);
  },
});
