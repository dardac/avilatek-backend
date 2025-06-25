import { Request, Response, Router, NextFunction } from "express";

import { authMiddleware } from "../middleware/auth.middleware";
import { OrderService } from "../services/order.service";
import { ApiError } from "../utils/errors";

interface CreateOrderRequestBody {
  items: { productId: number; quantity: number }[];
}

const router = Router();

// Middleware to check user's ownership
const userOwnsOrderMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const orderId = parseInt(req.params.id);
    if (!userId) {
      throw new ApiError(401, "UNAUTHORIZED", "Usuario no autenticado");
    }

    const order = await OrderService.getOrderById(orderId);
    if (order.userId !== userId) {
      throw new ApiError(
        403,
        "FORBIDDEN",
        "No tienes permiso para acceder a este pedido"
      );
    }
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Crear un nuevo pedido
 *     description: Crea un nuevo pedido para el usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: integer
 *                     quantity:
 *                       type: integer
 *     responses:
 *       201:
 *         description: Pedido creado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 userId:
 *                   type: string
 *                 total:
 *                   type: number
 *                 status:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       productId:
 *                         type: integer
 *                       productName:
 *                         type: string
 *                       quantity:
 *                         type: integer
 *                       price:
 *                         type: number
 *       400:
 *         description: Entrada inválida
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/",
  authMiddleware,
  async (
    req: Request<{}, {}, CreateOrderRequestBody>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { items } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new ApiError(401, "UNAUTHORIZED", "Usuario no autenticado");
      }
      if (!items || !Array.isArray(items) || items.length === 0) {
        throw new ApiError(
          400,
          "INVALID_ITEMS",
          "Se requiere al menos un ítem en el pedido"
        );
      }
      for (const item of items) {
        if (!Number.isInteger(item.productId) || item.productId <= 0) {
          throw new ApiError(
            400,
            "INVALID_PRODUCT_ID",
            "El ID del producto debe ser un número entero positivo"
          );
        }
        if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
          throw new ApiError(
            400,
            "INVALID_QUANTITY",
            "La cantidad debe ser un número entero positivo"
          );
        }
      }

      const order = await OrderService.createOrder({ userId, items });
      res.status(201).json(order);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Listar pedidos del usuario autenticado
 *     description: Obtiene una lista paginada de pedidos del usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Tamaño de página
 *     responses:
 *       200:
 *         description: Lista de pedidos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   userId:
 *                     type: string
 *                   total:
 *                     type: number
 *                   status:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                   items:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         productId:
 *                           type: integer
 *                         productName:
 *                           type: string
 *                         quantity:
 *                           type: integer
 *                         price:
 *                           type: number
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/",
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ApiError(401, "UNAUTHORIZED", "Usuario no autenticado");
      }

      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;

      if (page < 1 || pageSize < 1) {
        throw new ApiError(
          400,
          "INVALID_PAGINATION",
          "Los parámetros page y pageSize deben ser mayores a 0"
        );
      }

      const orders = await OrderService.getOrdersByUser(userId, page, pageSize);
      res.json(orders);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Obtener un pedido por ID
 *     description: Obtiene los detalles de un pedido específico del usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del pedido
 *     responses:
 *       200:
 *         description: Detalles del pedido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 userId:
 *                   type: string
 *                 total:
 *                   type: number
 *                 status:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       productId:
 *                         type: integer
 *                       productName:
 *                         type: string
 *                       quantity:
 *                         type: integer
 *                       price:
 *                         type: number
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado
 *       404:
 *         description: Pedido no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/:id",
  [authMiddleware, userOwnsOrderMiddleware],
  async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        throw new ApiError(
          400,
          "INVALID_ID",
          "El ID debe ser un número válido"
        );
      }

      const order = await OrderService.getOrderById(id);
      res.json(order);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
