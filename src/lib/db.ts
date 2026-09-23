import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";
import { env } from "@/lib/env";

/**
 * Cliente Prisma singleton.
 * En desarrollo, Next.js recarga módulos con HMR; guardar la instancia en
 * globalThis evita abrir un pool de conexiones nuevo en cada recarga.
 *
 * En serverless (Vercel) cada instancia de función abre su propio pool, por eso
 * DATABASE_URL apunta al pooler de transacciones de Supabase (puerto 6543) y el
 * pool local se limita a pocas conexiones.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({
    connectionString: env.DATABASE_URL,
    max: env.NODE_ENV === "production" ? 3 : 10,
  });

  return new PrismaClient({
    adapter,
    log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma: PrismaClient = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
