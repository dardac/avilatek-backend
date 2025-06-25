import { Request, Response, Router, NextFunction } from "express";

import { authMiddleware } from "../middlewares/auth.middleware";
import { ProductService } from "../services/product.service";
import { ApiError } from "../utils";

interface CreateProductRequestBody {
  name: string;
  description?: string;
  price: number;
  stock: number;
}

interface UpdateProductRequestBody {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
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
 * /products:
 *   get:
 *     summary: Listar productos disponibles
 *     description: Obtiene una lista paginada de productos con stock mayor a 0
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
 *         description: Lista de productos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *                   price:
 *                     type: number
 *                   stock:
 *                     type: integer
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;

      if (page < 1 || pageSize < 1) {
        throw new ApiError(
          400,
          "INVALID_PAGINATION",
          "Los parámetros page y pageSize deben ser mayores a 0"
        );
      }

      const products = await ProductService.getProducts(page, pageSize);
      res.json(products);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Obtener un producto por ID
 *     description: Obtiene los detalles de un producto específico
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del producto
 *     responses:
 *       200:
 *         description: Detalles del producto
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *                 price:
 *                   type: number
 *                 stock:
 *                   type: integer
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Producto no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/:id",
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

      const product = await ProductService.getProductById(id);
      res.json(product);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Crear un nuevo producto
 *     description: Crea un nuevo producto (solo administradores)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Laptop
 *               description:
 *                 type: string
 *                 example: Laptop de alta gama
 *               price:
 *                 type: number
 *                 example: 999.99
 *               stock:
 *                 type: number
 *                 example: 50
 *     responses:
 *       201:
 *         description: Producto creado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *                 price:
 *                   type: number
 *                 stock:
 *                   type: integer
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
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado
 */
router.post(
  "/",
  [authMiddleware, adminMiddleware],
  async (
    req: Request<{}, {}, CreateProductRequestBody>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { name, description, price, stock } = req.body;

      if (!name) {
        throw new ApiError(
          400,
          "INVALID_NAME",
          "El nombre del producto es requerido"
        );
      }
      if (price === undefined) {
        throw new ApiError(400, "INVALID_PRICE", "El precio es requerido");
      }
      if (stock === undefined) {
        throw new ApiError(400, "INVALID_STOCK", "El stock es requerido");
      }

      const product = await ProductService.createProduct({
        name,
        description,
        price,
        stock,
      });
      res.status(201).json(product);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Actualizar un producto
 *     description: Actualiza un producto existente (solo administradores)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del producto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Laptop
 *               description:
 *                 type: string
 *                 example: Laptop actualizada
 *               price:
 *                 type: number
 *                 example: 1099.99
 *               stock:
 *                 type: number
 *                 example: 40
 *     responses:
 *       200:
 *         description: Producto actualizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *                 price:
 *                   type: number
 *                 stock:
 *                   type: integer
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Entrada inválida
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado
 *       404:
 *         description: Producto no encontrado
 */
router.put(
  "/:id",
  [authMiddleware, adminMiddleware],
  async (
    req: Request<{ id: string }, {}, UpdateProductRequestBody>,
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

      const { name, description, price, stock } = req.body;
      const product = await ProductService.updateProduct(id, {
        name,
        description,
        price,
        stock,
      });
      res.json(product);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Eliminar un producto
 *     description: Elimina un producto existente (solo administradores)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del producto
 *     responses:
 *       204:
 *         description: Producto eliminado
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado
 *       404:
 *         description: Producto no encontrado
 */
router.delete(
  "/:id",
  [authMiddleware, adminMiddleware],
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

      await ProductService.deleteProduct(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export default router;
