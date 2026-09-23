import "server-only";

import { startOfDay, subDays } from "date-fns";

import { getAlertSummary } from "@/features/alerts/queries";
import { type DailyMovementPoint, fillDailySeries } from "@/features/dashboard/lib/series";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import type { MovementType } from "@/lib/domain";

export interface DashboardKpis {
  inventoryValue: number;
  inventoryUnits: number;
  activeProducts: number;
  lowStock: number;
  outOfStock: number;
  movementsToday: number;
  openPurchaseOrders: number;
}

export interface TopProduct {
  id: string;
  sku: string;
  name: string;
  units: number;
  value: number;
}

export interface RecentMovement {
  id: string;
  type: MovementType;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  warehouse: string;
  userName: string;
  createdAt: Date;
}

export interface DashboardData {
  kpis: DashboardKpis;
  series: DailyMovementPoint[];
  topProducts: TopProduct[];
  recentMovements: RecentMovement[];
}

const SERIES_DAYS = 30;

export async function getDashboardData(now: Date = new Date()): Promise<DashboardData> {
  const since = startOfDay(subDays(now, SERIES_DAYS - 1));

  const [
    valuation,
    activeProducts,
    alerts,
    movementsToday,
    openPurchaseOrders,
    dailyRows,
    topRows,
    recent,
  ] = await Promise.all([
    prisma.$queryRaw<{ value: number; units: number }[]>(Prisma.sql`
        SELECT ISNULL(SUM(st.quantity * p.avg_cost), 0) AS value, ISNULL(SUM(st.quantity), 0) AS units
        FROM stocks st INNER JOIN products p ON p.id = st.product_id
        WHERE p.is_active = 1`),
    prisma.product.count({ where: { isActive: true } }),
    getAlertSummary(),
    prisma.stockMovement.count({ where: { createdAt: { gte: startOfDay(now) } } }),
    prisma.purchaseOrder.count({ where: { status: { in: ["SENT", "PARTIALLY_RECEIVED"] } } }),
    prisma.$queryRaw<
      { day: string; inbound: number; outbound: number; movements: number }[]
    >(Prisma.sql`
        SELECT CONVERT(varchar(10), created_at, 23) AS day,
               SUM(CASE WHEN type <> 'TRANSFER' AND to_warehouse_id IS NOT NULL THEN quantity ELSE 0 END) AS inbound,
               SUM(CASE WHEN type <> 'TRANSFER' AND from_warehouse_id IS NOT NULL THEN quantity ELSE 0 END) AS outbound,
               COUNT(*) AS movements
        FROM stock_movements
        WHERE created_at >= ${since}
        GROUP BY CONVERT(varchar(10), created_at, 23)`),
    prisma.$queryRaw<
      { id: string; sku: string; name: string; units: number; value: number }[]
    >(Prisma.sql`
        SELECT TOP 10 p.id, p.sku, p.name, SUM(st.quantity) AS units, SUM(st.quantity * p.avg_cost) AS value
        FROM stocks st INNER JOIN products p ON p.id = st.product_id
        WHERE p.is_active = 1
        GROUP BY p.id, p.sku, p.name
        HAVING SUM(st.quantity) > 0
        ORDER BY value DESC`),
    prisma.stockMovement.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        product: { select: { name: true, unit: true } },
        fromWarehouse: { select: { code: true } },
        toWarehouse: { select: { code: true } },
        user: { select: { name: true } },
      },
    }),
  ]);

  return {
    kpis: {
      inventoryValue: Number(valuation[0]?.value ?? 0),
      inventoryUnits: Number(valuation[0]?.units ?? 0),
      activeProducts,
      lowStock: alerts.total,
      outOfStock: alerts.outOfStock,
      movementsToday,
      openPurchaseOrders,
    },
    series: fillDailySeries(
      dailyRows.map((row) => ({
        day: row.day,
        inbound: Number(row.inbound),
        outbound: Number(row.outbound),
        movements: Number(row.movements),
      })),
      SERIES_DAYS,
      now,
    ),
    topProducts: topRows.map((row) => ({
      id: row.id,
      sku: row.sku,
      name: row.name,
      units: Number(row.units),
      value: Number(row.value),
    })),
    recentMovements: recent.map((movement) => ({
      id: movement.id,
      type: movement.type as MovementType,
      productId: movement.productId,
      productName: movement.product.name,
      quantity: movement.quantity,
      unit: movement.product.unit,
      warehouse:
        movement.fromWarehouse && movement.toWarehouse
          ? `${movement.fromWarehouse.code} → ${movement.toWarehouse.code}`
          : (movement.fromWarehouse?.code ?? movement.toWarehouse?.code ?? "-"),
      userName: movement.user.name,
      createdAt: movement.createdAt,
    })),
  };
}
