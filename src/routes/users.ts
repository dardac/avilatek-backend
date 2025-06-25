import { Router, Request, Response, NextFunction } from "express";

import { authMiddleware } from "../middleware/auth.middleware";
import { UserService } from "../services/user.service";
import { ApiError } from "../utils/errors";

interface UpdateRoleRequestBody {
  role: "user" | "admin";
}

const router = Router();

// Middleware to check admin role
const adminMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== "admin") {
      throw new ApiError(
        403,
        "FORBIDDEN",
        "Acceso denegado: se requiere rol de administrador"
      );
    }
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /users/{id}/role:
 *   patch:
 *     summary: Actualizar el rol de un usuario
 *     description: Permite a un administrador actualizar el rol de un usuario (user o admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *                 example: admin
 *     responses:
 *       200:
 *         description: Rol actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 email:
 *                   type: string
 *                 name:
 *                   type: string
 *                 role:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Entrada inválida
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: INVALID_INPUT
 *                     message:
 *                       type: string
 *                       example: El campo "role" es requerido
 *                     details:
 *                       type: string
 *                       example: Debe proporcionar un rol válido
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado
 *       404:
 *         description: Usuario no encontrado
 */
router.patch(
  "/:id/role",
  [authMiddleware, adminMiddleware],
  async (
    req: Request<{ id: string }, {}, UpdateRoleRequestBody>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!role) {
        throw new ApiError(
          400,
          "INVALID_INPUT",
          'El campo "role" es requerido',
          "Debe proporcionar un rol válido"
        );
      }

      const result = await UserService.updateUserRole(id, { role });
      res.json(result);
    } catch (error: any) {
      next(error);
    }
  }
);

export default router;
