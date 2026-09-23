import { PrismaMssql } from "@prisma/adapter-mssql";

import { PrismaClient } from "@/generated/prisma/client";
import { env } from "@/lib/env";

/**
 * Cliente Prisma singleton.
 * En desarrollo, Next.js recarga módulos con HMR; guardar la instancia en
 * globalThis evita abrir un pool de conexiones nuevo en cada recarga.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaMssql(env.DATABASE_URL);

  return new PrismaClient({
    adapter,
    log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma: PrismaClient = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
