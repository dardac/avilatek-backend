import "dotenv/config";
import express, { Express, Request, Response } from "express";
import swaggerUi from "swagger-ui-express";

import { errorMiddleware } from "./middleware/error.middleware";
import { rateLimitMiddleware } from "./middleware/rate-limit.middleware";
import authRoutes from "./routes/auth";
import orderRoutes from "./routes/orders";
import productRoutes from "./routes/products";
import userRoutes from "./routes/users";
import { setupSwagger } from "./swagger";

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
