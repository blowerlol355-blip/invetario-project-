import "server-only";

import { buildKardex, type Kardex } from "@/features/reports/lib/kardex";
import type { InventoryReportFilters, KardexFilters } from "@/features/reports/schemas";
import { buildMovementWhere, dateRangeWhere, type MovementRow } from "@/features/stock/queries";
import type { MovementFilters } from "@/features/stock/schemas";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import type { MovementType } from "@/lib/domain";

// ----------------------------- Inventario valorizado ----------------

export interface InventoryValuationRow {
  productId: string;
  sku: string;
  name: string;
  categoryName: string;
  unit: string;
  quantity: number;
  avgCost: number;
  value: number;
  minStock: number;
}

export interface InventoryValuation {
  rows: InventoryValuationRow[];
  totals: { products: number; quantity: number; value: number };
}

interface RawValuationRow {
  id: string;
  sku: string;
  name: string;
  category_name: string;
  unit: string;
  min_stock: number;
  avg_cost: number;
  quantity: number;
}

/** Existencia y valor (unidades × costo promedio) de cada producto activo, opcionalmente por almacén. */
export async function getInventoryValuation(
  filters: InventoryReportFilters,
): Promise<InventoryValuation> {
  const warehouseJoin = filters.warehouseId
    ? Prisma.sql`AND st.warehouse_id = ${filters.warehouseId}`
    : Prisma.empty;
  const categoryWhere = filters.categoryId
    ? Prisma.sql`AND p.category_id = ${filters.categoryId}`
    : Prisma.empty;
  const search = filters.q
    ? Prisma.sql`AND (p.name ILIKE ${`%${filters.q}%`} OR p.sku ILIKE ${`%${filters.q}%`})`
    : Prisma.empty;

  const rows = await prisma.$queryRaw<RawValuationRow[]>(Prisma.sql`
    SELECT p.id, p.sku, p.name, c.name AS category_name, p.unit, p.min_stock, p.avg_cost,
           COALESCE(SUM(st.quantity), 0) AS quantity
    FROM products p
    INNER JOIN categories c ON c.id = p.category_id
    LEFT JOIN stocks st ON st.product_id = p.id ${warehouseJoin}
    WHERE p.is_active ${categoryWhere} ${search}
    GROUP BY p.id, p.sku, p.name, c.name, p.unit, p.min_stock, p.avg_cost
    ORDER BY c.name ASC, p.name ASC
  `);

  const mapped = rows.map((row) => {
    const quantity = Number(row.quantity);
    const avgCost = Number(row.avg_cost);
    return {
      productId: row.id,
      sku: row.sku,
      name: row.name,
      categoryName: row.category_name,
      unit: row.unit,
      quantity,
      avgCost,
      value: Math.round(quantity * avgCost * 100) / 100,
      minStock: row.min_stock,
    };
  });

  return {
    rows: mapped,
    totals: {
      products: mapped.length,
      quantity: mapped.reduce((sum, row) => sum + row.quantity, 0),
      value: Math.round(mapped.reduce((sum, row) => sum + row.value, 0) * 100) / 100,
    },
  };
}

// ----------------------------- Kardex --------------------------------

export interface KardexReport {
  product: { id: string; sku: string; name: string; unit: string; avgCost: number };
  warehouse: { id: string; code: string; name: string } | null;
  from: string;
  to: string;
  kardex: Kardex;
  warehouseCodes: Map<string, string>;
}

export async function getKardexReport(
  filters: KardexFilters & { from: string; to: string },
): Promise<KardexReport | null> {
  if (!filters.productId) return null;
  const [product, warehouse, warehouses] = await Promise.all([
    prisma.product.findUnique({
      where: { id: filters.productId },
      select: { id: true, sku: true, name: true, unit: true, avgCost: true },
    }),
    filters.warehouseId
      ? prisma.warehouse.findUnique({
          where: { id: filters.warehouseId },
          select: { id: true, code: true, name: true },
        })
      : Promise.resolve(null),
    prisma.warehouse.findMany({ select: { id: true, code: true } }),
  ]);
  if (!product) return null;

  const warehouseId = warehouse?.id ?? null;
  const fromDate = new Date(`${filters.from}T00:00:00`);
  const warehouseScopeIn = warehouseId
    ? Prisma.sql`AND to_warehouse_id = ${warehouseId}`
    : Prisma.empty;
  const warehouseScopeOut = warehouseId
    ? Prisma.sql`AND from_warehouse_id = ${warehouseId}`
    : Prisma.empty;

  const [opening, movements] = await Promise.all([
    prisma.$queryRaw<{ balance: number }[]>(Prisma.sql`
      SELECT COALESCE(SUM(CASE WHEN to_warehouse_id IS NOT NULL ${warehouseScopeIn} THEN quantity ELSE 0 END), 0)
           - COALESCE(SUM(CASE WHEN from_warehouse_id IS NOT NULL ${warehouseScopeOut} THEN quantity ELSE 0 END), 0) AS balance
      FROM stock_movements
      WHERE product_id = ${product.id} AND created_at < ${fromDate.toISOString()}::timestamp
    `),
    prisma.stockMovement.findMany({
      where: {
        productId: product.id,
        createdAt: dateRangeWhere(filters.from, filters.to),
        ...(warehouseId
          ? { OR: [{ fromWarehouseId: warehouseId }, { toWarehouseId: warehouseId }] }
          : {}),
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      include: { user: { select: { name: true } } },
    }),
  ]);

  const kardex = buildKardex(
    Number(opening[0]?.balance ?? 0),
    movements.map((movement) => ({
      id: movement.id,
      type: movement.type as MovementType,
      fromWarehouseId: movement.fromWarehouseId,
      toWarehouseId: movement.toWarehouseId,
      quantity: movement.quantity,
      unitCost: movement.unitCost === null ? null : Number(movement.unitCost),
      reason: movement.reason,
      reference: movement.reference,
      userName: movement.user.name,
      createdAt: movement.createdAt,
    })),
    warehouseId,
  );

  return {
    product: { ...product, avgCost: Number(product.avgCost) },
    warehouse,
    from: filters.from,
    to: filters.to,
    kardex,
    warehouseCodes: new Map(warehouses.map((w) => [w.id, w.code])),
  };
}

// ----------------------------- Movimientos ---------------------------

export const MOVEMENT_EXPORT_LIMIT = 5000;

/** Todos los movimientos del rango (hasta el límite) para exportación. */
export async function getMovementsForExport(
  filters: MovementFilters,
  q = "",
): Promise<{ rows: MovementRow[]; truncated: boolean }> {
  const where = buildMovementWhere({ q }, filters);
  const rows = await prisma.stockMovement.findMany({
    where,
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: MOVEMENT_EXPORT_LIMIT + 1,
    include: {
      product: { select: { name: true, sku: true, unit: true } },
      fromWarehouse: { select: { code: true } },
      toWarehouse: { select: { code: true } },
      user: { select: { name: true } },
    },
  });
  const truncated = rows.length > MOVEMENT_EXPORT_LIMIT;
  return {
    truncated,
    rows: rows.slice(0, MOVEMENT_EXPORT_LIMIT).map((movement) => ({
      id: movement.id,
      type: movement.type as MovementType,
      productId: movement.productId,
      productName: movement.product.name,
      sku: movement.product.sku,
      unit: movement.product.unit,
      fromWarehouse: movement.fromWarehouse?.code ?? null,
      toWarehouse: movement.toWarehouse?.code ?? null,
      quantity: movement.quantity,
      unitCost: movement.unitCost === null ? null : Number(movement.unitCost),
      reason: movement.reason,
      reference: movement.reference,
      userName: movement.user.name,
      createdAt: movement.createdAt,
    })),
  };
}
