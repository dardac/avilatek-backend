import { PrismaClient } from "@prisma/client";

import { ApiError, supabase, withRetry } from "../utils";

const prisma = new PrismaClient();

interface RegisterInput {
  email: string;
  password: string;
  name?: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface UserResponse {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

interface RegisterResponse {
  user: UserResponse;
  message: string;
}

interface LoginResponse {
  user: UserResponse;
  token: string;
}

export class AuthService {
  static async register({
    email,
    password,
    name,
  }: RegisterInput): Promise<RegisterResponse> {
    try {
      if (!email || !email.includes("@")) {
        throw new ApiError(
          400,
          "INVALID_EMAIL",
          "El email es inválido o no fue proporcionado"
        );
      }
      if (!password || password.length < 6) {
        throw new ApiError(
          400,
          "INVALID_PASSWORD",
          "La contraseña debe tener al menos 6 caracteres"
        );
      }

      // Register user on Supabase
      const { data, error } = await withRetry(
        () =>
          supabase.auth.signUp({
            email,
            password,
            options: { data: { name } },
          }),
        "registro en Supabase"
      );

      if (error) {
        if (
          error.message.includes("User already registered") ||
          error.code === "auth/user-already-exists"
        ) {
          throw new ApiError(
            400,
            "EMAIL_ALREADY_EXISTS",
            "El email ya está registrado",
            error.message
          );
        }
        throw new ApiError(
          400,
          "SUPABASE_AUTH_FAILED",
          "Error al registrar en Supabase",
          error.message
        );
      }

      if (!data.user) {
        console.error("No se recibió data.user de Supabase");
        throw new ApiError(
          400,
          "SUPABASE_AUTH_FAILED",
          "No se pudo crear el usuario en Supabase"
        );
      }

      // Create user on Prisma
      console.log("Creando usuario en Prisma con ID:", data.user.id);
      const user = await withRetry(
        () =>
          prisma.user.create({
            data: {
              id: data.user?.id,
              email: data.user?.email!,
              password: "hashed_by_supabase",
              name: name || null,
              role: "user",
            },
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
            },
          }),
        "crear usuario en Prisma"
      );

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          role: user.role,
        },
        message: "Usuario registrado exitosamente",
      };
    } catch (error: any) {
      throw error instanceof ApiError
        ? error
        : new ApiError(
            500,
            "REGISTRATION_FAILED",
            "Error al registrar usuario",
            error.message || "Error desconocido"
          );
    }
  }

  static async login({ email, password }: LoginInput): Promise<LoginResponse> {
    try {
      if (!email || !email.includes("@")) {
        throw new ApiError(
          400,
          "INVALID_EMAIL",
          "El email es inválido o no fue proporcionado"
        );
      }
      if (!password) {
        throw new ApiError(
          400,
          "INVALID_PASSWORD",
          "La contraseña es requerida"
        );
      }

      const { data, error } = await withRetry(
        () =>
          supabase.auth.signInWithPassword({
            email,
            password,
          }),
        "inicio de sesión en Supabase"
      );

      if (error) {
        throw new ApiError(
          400,
          "LOGIN_FAILED",
          "Credenciales inválidas",
          error.message
        );
      }

      if (!data.user) {
        throw new ApiError(
          400,
          "SUPABASE_AUTH_FAILED",
          "No se pudo autenticar el usuario"
        );
      }

      console.log("Buscando usuario en Prisma con ID:", data.user.id);
      const user = await withRetry(
        () =>
          prisma.user.findUnique({
            where: { id: data.user.id },
            select: { id: true, email: true, name: true, role: true },
          }),
        "obtener usuario en Prisma"
      );

      if (!user) {
        console.error("Usuario no encontrado en Prisma:", data.user.id);
        throw new ApiError(
          404,
          "USER_NOT_FOUND",
          "Usuario no encontrado",
          "El ID no corresponde a un usuario registrado"
        );
      }

      console.log("Usuario encontrado en Prisma:", user);

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          role: user.role,
        },
        token: data.session?.access_token || "",
      };
    } catch (error: any) {
      console.error("Error en login:", {
        message: error.message,
        code: error.code,
        stack: error.stack,
      });
      throw error instanceof ApiError
        ? error
        : new ApiError(
            500,
            "LOGIN_FAILED",
            "Error al iniciar sesión",
            error.message || "Error desconocido"
          );
    }
  }
}
