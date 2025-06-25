import swaggerJsdoc from "swagger-jsdoc";

const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "AvilaTek Backend API",
      version: "1.0.0",
      description: "API para el backend de AvilaTek",
    },
    servers: [
      {
        url: "/api",
        description: "API Server",
      },
    ],
    components: {
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: {
              type: "object",
              properties: {
                code: { type: "string" },
                message: { type: "string" },
                details: { type: ["string", "null"] },
              },
            },
          },
        },
      },
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./src/routes/*.ts"],
};

export const setupSwagger = () => swaggerJsdoc(swaggerOptions);