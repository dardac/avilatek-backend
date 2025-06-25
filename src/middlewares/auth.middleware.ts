import { PrismaClient } from "@prisma/client";
import { Request, Response, NextFunction } from "express";

import { ApiError, supabase, withRetry } from "../utils";

const prisma = new PrismaClient();

interface AuthenticatedUser {
  id: string;
  email?: string;
  role: string;
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ApiError(
        401,
        "INVALID_TOKEN",
        "Token no proporcionado o inválido"
      );
    }

    const token = authHeader.split(" ")[1];
    // Check Supabase token
    const { data, error } = await withRetry(
      () => supabase.auth.getUser(token),
      "verificación de token"
    );

    if (error || !data.user) {
      console.error("Error en Supabase Auth:", error?.message);
      throw new ApiError(401, "INVALID_TOKEN", "Token inválido o expirado");
    }

    console.log("ID de usuario de Supabase:", data.user.id);

    // Get role from Prisma's user
    const user = await prisma.user.findUnique({
      where: { id: data.user.id },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      console.error("Usuario no encontrado en Prisma para ID:", data.user.id);
      throw new ApiError(
        401,
        "USER_NOT_FOUND",
        "Usuario no encontrado",
        "El ID proporcionado no corresponde a ningún usuario registrado."
      );
    }

    // Add user to request
    req.user = user;
    next();
  } catch (error: any) {
    console.error("Error en authMiddleware:", error);
    next(
      error instanceof ApiError
        ? error
        : new ApiError(401, "AUTHENTICATION_FAILED", "Error de autenticación")
    );
  }
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
