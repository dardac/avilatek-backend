import { Router, Request, Response } from "express";

import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

/**
 * @swagger
 * /protected:
 *   get:
 *     summary: Endpoint protegido
 *     description: Devuelve información del usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Información del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.get(
  "/protected",
  authMiddleware,
  function (req: Request, res: Response) {
    if (!req.user) {
      res.status(401).json({ error: "Usuario no autenticado" });
      return;
    }
    res.json({ user: req.user });
  }
);

export default router;
