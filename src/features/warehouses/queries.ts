import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import {
  type ListParams,
  paginate,
  type Paginated,
  pagination,
  resolveSort,
  statusWhere,
} from "@/lib/query-params";

export interface WarehouseRow {
  id: string;
  code: string;
  name: string;
  address: string | null;
  isActive: boolean;
  createdAt: Date;
  /** Unidades totales almacenadas (suma de existencias). */
  stockUnits: number;
  /** Productos distintos con existencia > 0. */
  productCount: number;
}

export const WAREHOUSE_SORTS = ["code", "name", "createdAt"] as const;

export async function listWarehouses(params: ListParams): Promise<Paginated<WarehouseRow>> {
  const sort = resolveSort(params.sort, WAREHOUSE_SORTS, "code");
  const where: Prisma.WarehouseWhereInput = {
    ...statusWhere(params.status),
    ...(params.q
      ? {
          OR: [
            { code: { contains: params.q, mode: "insensitive" } },
            { name: { contains: params.q, mode: "insensitive" } },
            { address: { contains: params.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [rows, total] = await prisma.$transaction([
    prisma.warehouse.findMany({ where, orderBy: { [sort]: params.order }, ...pagination(params) }),
    prisma.warehouse.count({ where }),
  ]);

  const stockByWarehouse = await prisma.stock.groupBy({
    by: ["warehouseId"],
    where: { warehouseId: { in: rows.map((row) => row.id) }, quantity: { gt: 0 } },
    _sum: { quantity: true },
    _count: { productId: true },
  });
  const stockMap = new Map(
    stockByWarehouse.map((entry) => [
      entry.warehouseId,
      { units: entry._sum.quantity ?? 0, products: entry._count.productId },
    ]),
  );

  return paginate(
    rows.map((warehouse) => ({
      ...warehouse,
      stockUnits: stockMap.get(warehouse.id)?.units ?? 0,
      productCount: stockMap.get(warehouse.id)?.products ?? 0,
    })),
    total,
    params,
  );
}

export interface WarehouseOption {
  id: string;
  code: string;
  name: string;
}

/** Almacenes activos para selects (movimientos, órdenes de compra). */
export async function getWarehouseOptions(): Promise<WarehouseOption[]> {
  return prisma.warehouse.findMany({
    where: { isActive: true },
    orderBy: { code: "asc" },
    select: { id: true, code: true, name: true },
  });
}
