import { PrismaClient } from "@prisma/client";

import { ApiError } from "../utils";

const prisma = new PrismaClient();

interface UpdateRoleInput {
  role: "user" | "admin";
}

interface UserResponse {
  id: string;
  email: string;
  name?: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export class UserService {
  static async updateUserRole(
    userId: string,
    data: UpdateRoleInput
  ): Promise<UserResponse> {
    try {
      // Validate role
      if (!["user", "admin"].includes(data.role)) {
        throw new ApiError(
          400,
          "INVALID_ROLE",
          "Rol inválido. Debe ser \"user\" o \"admin\""
        );
      }

      // Update user
      const user = await prisma.user.update({
        where: { id: userId },
        data: { role: data.role },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return {
        id: user.id,
        email: user.email,
        name: user.name ?? undefined,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    } catch (error: any) {
      if (error.code === "P2025") {
        throw new ApiError(
          404,
          "USER_NOT_FOUND",
          "Usuario no encontrado",
          "El ID proporcionado no corresponde a ningún usuario registrado."
        );
      }
      console.error("Error en updateUserRole:", error.message);
      throw error instanceof ApiError
        ? error
        : new ApiError(
            500,
            "UPDATE_ROLE_FAILED",
            "Error al actualizar el rol del usuario"
          );
    }
  }
}
