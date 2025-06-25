import { Request, Response, NextFunction } from "express";

import { ApiError } from "../utils";

export const errorMiddleware = (
  err: Error | ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
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
  res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Ocurrió un error inesperado en el servidor",
      details: err.message || null,
    },
  });
};
