import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { type ListParams, paginate, type Paginated, pagination } from "@/lib/query-params";

export interface AlertRow {
  id: string;
  sku: string;
  name: string;
  unit: string;
  categoryName: string;
  supplierId: string | null;
  supplierName: string | null;
  minStock: number;
  maxStock: number | null;
  totalStock: number;
  /** Unidades que faltan para volver al mínimo. */
  shortage: number;
  /** Cantidad sugerida a pedir (hasta el máximo o el doble del mínimo). */
  suggestedQuantity: number;
  /** Órdenes de compra abiertas que ya incluyen el producto. */
  openOrders: { id: string; code: string; pending: number }[];
}

export interface AlertSummary {
  total: number;
  outOfStock: number;
}

interface RawAlertRow {
  id: string;
  sku: string;
  name: string;
  unit: string;
  category_name: string;
  supplier_id: string | null;
  supplier_name: string | null;
  min_stock: number;
  max_stock: number | null;
  total_stock: number;
}

/**
 * Productos activos cuya existencia total es <= stock mínimo.
 * La condición depende de un agregado (SUM de stocks), así que se resuelve en SQL.
 */
function alertsSelect(q: string) {
  const search = q
    ? Prisma.sql`AND (p.name LIKE ${`%${q}%`} OR p.sku LIKE ${`%${q}%`})`
    : Prisma.empty;
  return Prisma.sql`
    SELECT p.id, p.sku, p.name, p.unit, c.name AS category_name,
           p.supplier_id, s.name AS supplier_name,
           p.min_stock, p.max_stock,
           ISNULL(SUM(st.quantity), 0) AS total_stock
    FROM products p
    INNER JOIN categories c ON c.id = p.category_id
    LEFT JOIN suppliers s ON s.id = p.supplier_id
    LEFT JOIN stocks st ON st.product_id = p.id
    WHERE p.is_active = 1 ${search}
    GROUP BY p.id, p.sku, p.name, p.unit, c.name, p.supplier_id, s.name, p.min_stock, p.max_stock
    HAVING ISNULL(SUM(st.quantity), 0) <= p.min_stock
  `;
}

export async function listAlerts(params: ListParams): Promise<Paginated<AlertRow>> {
  const { skip, take } = pagination(params);
  const base = alertsSelect(params.q);

  const [rows, countRows] = await Promise.all([
    prisma.$queryRaw<RawAlertRow[]>(Prisma.sql`
      ${base}
      ORDER BY (ISNULL(SUM(st.quantity), 0) - p.min_stock) ASC, p.name ASC
      OFFSET ${skip} ROWS FETCH NEXT ${take} ROWS ONLY
    `),
    prisma.$queryRaw<{ total: number }[]>(
      Prisma.sql`SELECT COUNT(*) AS total FROM (${base}) AS alerts`,
    ),
  ]);
  const total = Number(countRows[0]?.total ?? 0);

  const productIds = rows.map((row) => row.id);
  const openItems = productIds.length
    ? await prisma.purchaseOrderItem.findMany({
        where: {
          productId: { in: productIds },
          purchaseOrder: { status: { in: ["DRAFT", "SENT", "PARTIALLY_RECEIVED"] } },
        },
        select: {
          productId: true,
          quantityOrdered: true,
          quantityReceived: true,
          purchaseOrder: { select: { id: true, code: true } },
        },
      })
    : [];

  return paginate(
    rows.map((row) => {
      const totalStock = Number(row.total_stock);
      const target = row.max_stock ?? Math.max(row.min_stock * 2, 1);
      return {
        id: row.id,
        sku: row.sku,
        name: row.name,
        unit: row.unit,
        categoryName: row.category_name,
        supplierId: row.supplier_id,
        supplierName: row.supplier_name,
        minStock: row.min_stock,
        maxStock: row.max_stock,
        totalStock,
        shortage: Math.max(0, row.min_stock - totalStock),
        suggestedQuantity: Math.max(1, target - totalStock),
        openOrders: openItems
          .filter((item) => item.productId === row.id)
          .map((item) => ({
            id: item.purchaseOrder.id,
            code: item.purchaseOrder.code,
            pending: item.quantityOrdered - item.quantityReceived,
          })),
      };
    }),
    total,
    params,
  );
}

export async function getAlertSummary(): Promise<AlertSummary> {
  const rows = await prisma.$queryRaw<{ total_stock: number }[]>(Prisma.sql`
    SELECT ISNULL(SUM(st.quantity), 0) AS total_stock
    FROM products p LEFT JOIN stocks st ON st.product_id = p.id
    WHERE p.is_active = 1
    GROUP BY p.id, p.min_stock
    HAVING ISNULL(SUM(st.quantity), 0) <= p.min_stock
  `);
  return {
    total: rows.length,
    outOfStock: rows.filter((row) => Number(row.total_stock) <= 0).length,
  };
}
