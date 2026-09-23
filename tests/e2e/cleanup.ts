import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../../src/generated/prisma/client";

const E2E_PREFIX = "E2E-";

/**
 * Elimina todo lo creado por los tests E2E (productos con SKU E2E-, sus movimientos,
 * existencias, órdenes de compra y entradas de auditoría) para dejar el seed intacto.
 * Se ejecuta con tsx desde global-teardown.ts (el cliente Prisma generado es ESM).
 */
async function cleanup() {
  if (!process.env.DATABASE_URL) return;
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  try {
    const products = await prisma.product.findMany({
      where: { sku: { startsWith: E2E_PREFIX } },
      select: { id: true },
    });
    const productIds = products.map((product) => product.id);
    if (productIds.length === 0) {
      console.log("[e2e] limpieza: nada que eliminar.");
      return;
    }

    await prisma.$transaction(async (tx) => {
      const movements = await tx.stockMovement.findMany({
        where: { productId: { in: productIds } },
        select: { id: true },
      });
      const items = await tx.purchaseOrderItem.findMany({
        where: { productId: { in: productIds } },
        select: { purchaseOrderId: true },
      });
      const orderIds = [...new Set(items.map((item) => item.purchaseOrderId))];
      const entityIds = [...productIds, ...movements.map((m) => m.id), ...orderIds];

      await tx.auditLog.deleteMany({ where: { entityId: { in: entityIds } } });
      await tx.stockMovement.deleteMany({ where: { productId: { in: productIds } } });
      await tx.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: { in: orderIds } } });
      await tx.purchaseOrder.deleteMany({ where: { id: { in: orderIds } } });
      await tx.stock.deleteMany({ where: { productId: { in: productIds } } });
      await tx.product.deleteMany({ where: { id: { in: productIds } } });
    });
    console.log(`[e2e] limpieza: ${productIds.length} producto(s) de prueba eliminados.`);
  } finally {
    await prisma.$disconnect();
  }
}

cleanup().catch((error) => {
  console.error("[e2e] error en la limpieza:", error);
  process.exitCode = 1;
});
