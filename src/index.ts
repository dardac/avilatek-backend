import "dotenv/config";
import express, { Express, Request, Response } from "express";
import swaggerUi from "swagger-ui-express";

import { errorMiddleware } from "./middlewares/error.middleware";
import { rateLimitMiddleware } from "./middlewares/rate-limit.middleware";
import authRoutes from "./routes/auth.route";
import orderRoutes from "./routes/orders.route";
import productRoutes from "./routes/products.route";
import userRoutes from "./routes/users.route";
import { setupSwagger } from "./utils";

const app: Express = express();

app.use((req: Request, res: Response, next) => {
  console.log(`Solicitud recibida: ${req.method} ${req.originalUrl}`);
  next();
});

// Middlewares
app.use(express.json());
app.use("/api", rateLimitMiddleware);

// Rutes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", userRoutes);

// Swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(setupSwagger()));

// Middleware for error handling
app.use(errorMiddleware);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log(`Documentación en http://localhost:${PORT}/api-docs`);
});
