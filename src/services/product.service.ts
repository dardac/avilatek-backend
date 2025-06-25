import { PrismaClient } from "@prisma/client";

import { ApiError } from "../utils/errors";
import { withRetry } from "../utils/retry";

const prisma = new PrismaClient();

interface CreateProductInput {
  name: string;
  description?: string;
  price: number;
  stock: number;
}

interface UpdateProductInput {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
}

interface ProductResponse {
  id: number;
  name: string;
  description?: string;
  price: number;
  stock: number;
  createdAt: Date;
  updatedAt: Date;
}

export class ProductService {
  static async getProducts(
    page: number = 1,
    pageSize: number = 10
  ): Promise<ProductResponse[]> {
    try {
      const products = await withRetry(
        () =>
          prisma.product.findMany({
            where: { stock: { gt: 0 } },
            skip: (page - 1) * pageSize,
            take: pageSize,
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
              stock: true,
              createdAt: true,
              updatedAt: true,
            },
          }),
        "obtener productos"
      );

      return products.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description ?? undefined,
        price: product.price,
        stock: product.stock,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      }));
    } catch (error: any) {
      throw error instanceof ApiError
        ? error
        : new ApiError(
            500,
            "PRODUCT_FETCH_FAILED",
            "Error al obtener productos"
          );
    }
  }

  static async getProductById(id: number): Promise<ProductResponse> {
    try {
      const product = await withRetry(
        () =>
          prisma.product.findUnique({
            where: { id },
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
              stock: true,
              createdAt: true,
              updatedAt: true,
            },
          }),
        "obtener producto por ID"
      );

      if (!product) {
        throw new ApiError(
          404,
          "PRODUCT_NOT_FOUND",
          "Producto no encontrado",
          `No existe un producto con ID ${id}`
        );
      }

      return {
        id: product.id,
        name: product.name,
        description: product.description ?? undefined,
        price: product.price,
        stock: product.stock,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      };
    } catch (error: any) {
      throw error instanceof ApiError
        ? error
        : new ApiError(
            500,
            "PRODUCT_FETCH_FAILED",
            "Error al obtener producto"
          );
    }
  }

  static async createProduct(
    data: CreateProductInput
  ): Promise<ProductResponse> {
    try {
      if (data.price <= 0) {
        throw new ApiError(
          400,
          "INVALID_PRICE",
          "El precio debe ser mayor a 0"
        );
      }
      if (data.stock < 0) {
        throw new ApiError(
          400,
          "INVALID_STOCK",
          "El stock no puede ser negativo"
        );
      }
      if (!data.name) {
        throw new ApiError(
          400,
          "INVALID_NAME",
          "El nombre del producto es requerido"
        );
      }

      const product = await withRetry(
        () =>
          prisma.product.create({
            data: {
              name: data.name,
              description: data.description,
              price: data.price,
              stock: data.stock,
            },
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
              stock: true,
              createdAt: true,
              updatedAt: true,
            },
          }),
        "crear producto"
      );

      return {
        id: product.id,
        name: product.name,
        description: product.description ?? undefined,
        price: product.price,
        stock: product.stock,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      };
    } catch (error: any) {
      throw error instanceof ApiError
        ? error
        : new ApiError(
            500,
            "PRODUCT_CREATION_FAILED",
            "Error al crear producto"
          );
    }
  }

  static async updateProduct(
    id: number,
    data: UpdateProductInput
  ): Promise<ProductResponse> {
    try {
      if (data.price !== undefined && data.price <= 0) {
        throw new ApiError(
          400,
          "INVALID_PRICE",
          "El precio debe ser mayor a 0"
        );
      }
      if (data.stock !== undefined && data.stock < 0) {
        throw new ApiError(
          400,
          "INVALID_STOCK",
          "El stock no puede ser negativo"
        );
      }

      const product = await withRetry(
        () =>
          prisma.product.update({
            where: { id },
            data,
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
              stock: true,
              createdAt: true,
              updatedAt: true,
            },
          }),
        "actualizar producto"
      );

      return {
        id: product.id,
        name: product.name,
        description: product.description ?? undefined,
        price: product.price,
        stock: product.stock,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      };
    } catch (error: any) {
      if (error.code === "P2025") {
        throw new ApiError(
          404,
          "PRODUCT_NOT_FOUND",
          "Producto no encontrado",
          `No existe un producto con ID ${id}`
        );
      }
      throw error instanceof ApiError
        ? error
        : new ApiError(
            500,
            "PRODUCT_UPDATE_FAILED",
            "Error al actualizar producto"
          );
    }
  }

  static async deleteProduct(id: number): Promise<void> {
    try {
      await withRetry(
        () => prisma.product.delete({ where: { id } }),
        "eliminar producto"
      );
    } catch (error: any) {
      if (error.code === "P2025") {
        throw new ApiError(
          404,
          "PRODUCT_NOT_FOUND",
          "Producto no encontrado",
          `No existe un producto con ID ${id}`
        );
      }
      throw error instanceof ApiError
        ? error
        : new ApiError(
            500,
            "PRODUCT_DELETE_FAILED",
            "Error al eliminar producto"
          );
    }
  }
}
