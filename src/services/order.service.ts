import { PrismaClient } from "@prisma/client";

import { ApiError } from "../utils/errors";
import { withRetry } from "../utils/retry";

const prisma = new PrismaClient();

interface CreateOrderInput {
  userId: string;
  items: { productId: number; quantity: number }[];
}

interface OrderResponse {
  id: number;
  userId: string;
  total: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  items: {
    productId: number;
    productName: string;
    quantity: number;
    price: number;
  }[];
}

export class OrderService {
  static async createOrder(data: CreateOrderInput): Promise<OrderResponse> {
    try {
      if (!data.items || data.items.length === 0) {
        throw new ApiError(
          400,
          "INVALID_ITEMS",
          "Se requiere al menos un ítem en el pedido"
        );
      }

      // Get products and validate stock
      const products = await withRetry(
        () =>
          Promise.all(
            data.items.map(item =>
              prisma.product.findUnique({
                where: { id: item.productId },
                select: { id: true, name: true, price: true, stock: true },
              })
            )
          ),
        "obtener productos para pedido"
      );

      const invalidItems = data.items
        .map((item, index) => ({ ...item, product: products[index] }))
        .filter(
          ({ product, quantity }) =>
            !product || quantity <= 0 || quantity > product.stock
        );

      if (invalidItems.length > 0) {
        const details = invalidItems
          .map(({ product, quantity }) => {
            if (!product) return "Producto no encontrado";
            if (quantity <= 0)
              return `Cantidad inválida para producto ${product.name}`;
            return `Stock insuficiente para producto ${product.name} (disponible: ${product.stock})`;
          })
          .join("; ");
        throw new ApiError(
          400,
          "INVALID_ORDER",
          "Error en los ítems del pedido",
          details
        );
      }

      const total = data.items.reduce((sum, item) => {
        const product = products.find(p => p!.id === item.productId);
        return sum + product!.price * item.quantity;
      }, 0);

      // Create order
      const order = await withRetry(
        () =>
          prisma.$transaction(async tx => {
            const createdOrder = await tx.order.create({
              data: {
                userId: data.userId,
                total,
                status: "pending",
              },
              select: {
                id: true,
                userId: true,
                total: true,
                status: true,
                createdAt: true,
                updatedAt: true,
              },
            });

            // Update stock
            await Promise.all(
              data.items.map(item =>
                tx.product.update({
                  where: { id: item.productId },
                  data: { stock: { decrement: item.quantity } },
                })
              )
            );

            return createdOrder;
          }),
        "crear pedido"
      );

      // Get ítems from order
      const items = await withRetry(
        () =>
          prisma.orderItem.findMany({
            where: { orderId: order.id },
            select: {
              productId: true,
              quantity: true,
              price: true,
              product: { select: { name: true } },
            },
          }),
        "obtener ítems del pedido"
      );

      return {
        id: order.id,
        userId: order.userId,
        total: order.total,
        status: order.status,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        items: items.map(item => ({
          productId: item.productId,
          productName: item.product.name,
          quantity: item.quantity,
          price: item.price,
        })),
      };
    } catch (error: any) {
      throw error instanceof ApiError
        ? error
        : new ApiError(500, "ORDER_CREATION_FAILED", "Error al crear pedido");
    }
  }

  static async getOrdersByUser(
    userId: string,
    page: number = 1,
    pageSize: number = 10
  ): Promise<OrderResponse[]> {
    try {
      const orders = await withRetry(
        () =>
          prisma.order.findMany({
            where: { userId },
            skip: (page - 1) * pageSize,
            take: pageSize,
            select: {
              id: true,
              userId: true,
              total: true,
              status: true,
              createdAt: true,
              updatedAt: true,
              orderItems: {
                select: {
                  productId: true,
                  quantity: true,
                  price: true,
                  product: { select: { name: true } },
                },
              },
            },
          }),
        "obtener pedidos por usuario"
      );

      return orders.map(order => ({
        id: order.id,
        userId: order.userId,
        total: order.total,
        status: order.status,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        items: order.orderItems.map(item => ({
          productId: item.productId,
          productName: item.product.name,
          quantity: item.quantity,
          price: item.price,
        })),
      }));
    } catch (error: any) {
      throw error instanceof ApiError
        ? error
        : new ApiError(500, "ORDER_FETCH_FAILED", "Error al obtener pedidos");
    }
  }

  static async getOrderById(id: number): Promise<OrderResponse> {
    try {
      const order = await withRetry(
        () =>
          prisma.order.findUnique({
            where: { id },
            select: {
              id: true,
              userId: true,
              total: true,
              status: true,
              createdAt: true,
              updatedAt: true,
              orderItems: {
                select: {
                  productId: true,
                  quantity: true,
                  price: true,
                  product: { select: { name: true } },
                },
              },
            },
          }),
        "obtener pedido por ID"
      );

      if (!order) {
        throw new ApiError(
          404,
          "ORDER_NOT_FOUND",
          "Pedido no encontrado",
          `No existe un pedido con ID ${id}`
        );
      }

      return {
        id: order.id,
        userId: order.userId,
        total: order.total,
        status: order.status,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        items: order.orderItems.map(item => ({
          productId: item.productId,
          productName: item.product.name,
          quantity: item.quantity,
          price: item.price,
        })),
      };
    } catch (error: any) {
      throw error instanceof ApiError
        ? error
        : new ApiError(500, "ORDER_FETCH_FAILED", "Error al obtener pedido");
    }
  }
}
