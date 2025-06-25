import { Request, Response, NextFunction } from "express";

import { ApiError } from "../utils/errors";

export const errorMiddleware = (
  err: Error | ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.log("Error capturado en middleware:", {
    type: err.constructor.name,
    message: err.message,
    stack: err.stack,
    ...(err instanceof ApiError
      ? { status: err.status, code: err.code, details: err.details }
      : {}),
  });

  if (err instanceof ApiError) {
    res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details || null,
      },
    });
    return;
  }

  // Handle generic errors
  console.error("Error inesperado:", err);
  res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Ocurrió un error inesperado en el servidor",
      details: err.message || null,
    },
  });
};
