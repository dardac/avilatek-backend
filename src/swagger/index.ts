import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Avilatek Backend API",
      version: "1.0.0",
      description: "API REST para una plataforma de comercio electrónico",
    },
    servers: [
      {
        url: "http://localhost:3000",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: {
              type: "object",
              properties: {
                code: {
                  type: "string",
                  example: "INVALID_INPUT",
                },
                message: {
                  type: "string",
                  example: 'El campo "role" es requerido',
                },
                details: {
                  type: "string",
                  example: "Debe proporcionar un rol válido",
                },
              },
              required: ["code", "message"],
            },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.ts"],
};

export const setupSwagger = () => swaggerJsdoc(options);
