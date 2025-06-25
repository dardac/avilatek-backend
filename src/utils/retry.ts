import { ApiError } from "./errors";

export async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  maxAttempts: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: any;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(
        `Intento ${attempt} de ${maxAttempts} para: ${operationName}`
      );
      const result = await operation();
      return result;
    } catch (error: any) {
      lastError = error;
      console.error(`Error en intento ${attempt} de ${operationName}:`, {
        message: error.message,
        code: error.code,
        stack: error.stack,
      });

      if (attempt === maxAttempts) {
        console.error(`Máximo de intentos alcanzado para: ${operationName}`);
        break;
      }

      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      console.log(`Esperando ${delay}ms antes del siguiente intento`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError instanceof ApiError
    ? lastError
    : new ApiError(
        500,
        "RETRY_FAILED",
        `Fallo tras ${maxAttempts} intentos: ${operationName}`,
        lastError.message
      );
}
