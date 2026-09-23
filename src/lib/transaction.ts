import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

const DEFAULT_ATTEMPTS = 3;

/** Conflicto de escritura o deadlock detectado por la base de datos. */
export function isRetryableTransactionError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";
}

/**
 * Ejecuta `fn` en una transacción con aislamiento Serializable y reintenta ante
 * conflictos de concurrencia. Úsalo para toda operación que lea y luego escriba
 * existencias (movimientos, recepciones de órdenes de compra).
 */
export async function withSerializableTransaction<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
  options: { maxAttempts?: number } = {},
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? DEFAULT_ATTEMPTS;
  let attempt = 0;
  for (;;) {
    attempt += 1;
    try {
      return await prisma.$transaction(fn, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      if (isRetryableTransactionError(error) && attempt < maxAttempts) continue;
      throw error;
    }
  }
}
