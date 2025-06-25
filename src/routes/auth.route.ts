import { Router, Request, Response } from "express";

import { AuthService } from "../services/auth.service";

interface RegisterRequestBody {
  email: string;
  password: string;
  name?: string;
}

interface LoginRequestBody {
  email: string;
  password: string;
}

const router = Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Registrar un nuevo usuario
 *     description: Crea un nuevo usuario en el sistema
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: test@avilatek.com
 *               password:
 *                 type: string
 *                 example: 123456
 *               name:
 *                 type: string
 *                 example: Test User
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
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
 *                     name:
 *                       type: string
 *                 message:
 *                   type: string
 *                   example: Usuario registrado
 *       400:
 *         description: Error en la solicitud
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.post(
  "/register",
  async (
    req: Request<{}, {}, RegisterRequestBody>,
    res: Response
  ): Promise<void> => {
    try {
      const { email, password, name } = req.body;
      if (!email || !password) {
        res.status(400).json({ error: "Email y contraseña son requeridos" });
        return;
      }
      const result = await AuthService.register({ email, password, name });
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     description: Autentica un usuario y devuelve un token JWT
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: test@avilatek.com
 *               password:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       200:
 *         description: Inicio de sesión exitoso
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
 *                     name:
 *                       type: string
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Credenciales inválidas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.post(
  "/login",
  async (
    req: Request<{}, {}, LoginRequestBody>,
    res: Response
  ): Promise<void> => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ error: "Email y contraseña son requeridos" });
        return;
      }
      const result = await AuthService.login({ email, password });
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

export default router;
