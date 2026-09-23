import "server-only";

import type { MovementFilters } from "@/features/stock/schemas";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import type { MovementType } from "@/lib/domain";
import { type ListParams, paginate, type Paginated, pagination } from "@/lib/query-params";

export interface MovementRow {
  id: string;
  type: MovementType;
  productId: string;
  productName: string;
  sku: string;
  unit: string;
  fromWarehouse: string | null;
  toWarehouse: string | null;
  quantity: number;
  unitCost: number | null;
  reason: string | null;
  reference: string | null;
  userName: string;
  createdAt: Date;
}

/** Rango [inicio del día `from`, fin del día `to`] en hora local del servidor. */
export function dateRangeWhere(from: string, to: string): Prisma.DateTimeFilter | undefined {
  const filter: Prisma.DateTimeFilter = {};
  if (from) filter.gte = new Date(`${from}T00:00:00`);
  if (to) filter.lte = new Date(`${to}T23:59:59.999`);
  return Object.keys(filter).length > 0 ? filter : undefined;
}

export function buildMovementWhere(
  params: Pick<ListParams, "q">,
  filters: MovementFilters,
): Prisma.StockMovementWhereInput {
  const createdAt = dateRangeWhere(filters.from, filters.to);
  return {
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.productId ? { productId: filters.productId } : {}),
    ...(filters.userId ? { userId: filters.userId } : {}),
    ...(filters.warehouseId
      ? { OR: [{ fromWarehouseId: filters.warehouseId }, { toWarehouseId: filters.warehouseId }] }
      : {}),
    ...(createdAt ? { createdAt } : {}),
    ...(params.q
      ? {
          AND: [
            {
              OR: [
                { product: { name: { contains: params.q, mode: "insensitive" } } },
                { product: { sku: { contains: params.q, mode: "insensitive" } } },
                { reference: { contains: params.q, mode: "insensitive" } },
                { reason: { contains: params.q, mode: "insensitive" } },
              ],
            },
          ],
        }
      : {}),
  };
}

export async function listMovements(
  params: ListParams,
  filters: MovementFilters,
): Promise<Paginated<MovementRow>> {
  const where = buildMovementWhere(params, filters);
  const [rows, total] = await prisma.$transaction([
    prisma.stockMovement.findMany({
      where,
      orderBy: [{ createdAt: params.order === "asc" ? "asc" : "desc" }, { id: "desc" }],
      ...pagination(params),
      include: {
        product: { select: { name: true, sku: true, unit: true } },
        fromWarehouse: { select: { code: true } },
        toWarehouse: { select: { code: true } },
        user: { select: { name: true } },
      },
    }),
    prisma.stockMovement.count({ where }),
  ]);

  return paginate(
    rows.map((movement) => ({
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
    total,
    params,
  );
}

export interface ProductOption {
  id: string;
  sku: string;
  name: string;
  unit: string;
  supplierId: string | null;
  avgCost: number;
  costPrice: number;
  minStock: number;
  maxStock: number | null;
  stocks: { warehouseId: string; quantity: number }[];
}

/** Productos activos con su existencia por almacén, para el formulario de movimientos. */
export async function getProductOptions(): Promise<ProductOption[]> {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      sku: true,
      name: true,
      unit: true,
      supplierId: true,
      avgCost: true,
      costPrice: true,
      minStock: true,
      maxStock: true,
      stocks: { select: { warehouseId: true, quantity: true } },
    },
  });
  return products.map((product) => ({
    ...product,
    avgCost: Number(product.avgCost),
    costPrice: Number(product.costPrice),
  }));
}

export interface UserOption {
  id: string;
  name: string;
}

export async function getUserOptions(): Promise<UserOption[]> {
  return prisma.user.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
}

// ----------------------------- Existencias (API) ---------------------

export interface StockRow {
  productId: string;
  sku: string;
  productName: string;
  unit: string;
  minStock: number;
  warehouseId: string;
  warehouseCode: string;
  warehouseName: string;
  quantity: number;
  updatedAt: Date;
}

export interface StockFilters {
  productId?: string;
  warehouseId?: string;
  /** Incluye filas con existencia cero (por defecto se omiten). */
  includeZero?: boolean;
}

/** Existencia por producto y almacén, paginada; `q` busca por nombre o SKU. */
export async function listStock(
  params: ListParams,
  filters: StockFilters,
): Promise<Paginated<StockRow>> {
  const where: Prisma.StockWhereInput = {
    ...(filters.productId ? { productId: filters.productId } : {}),
    ...(filters.warehouseId ? { warehouseId: filters.warehouseId } : {}),
    ...(filters.includeZero ? {} : { quantity: { gt: 0 } }),
    ...(params.q
      ? {
          product: {
            OR: [
              { name: { contains: params.q, mode: "insensitive" } },
              { sku: { contains: params.q, mode: "insensitive" } },
            ],
          },
        }
      : {}),
  };

  const [rows, total] = await prisma.$transaction([
    prisma.stock.findMany({
      where,
      orderBy: [{ product: { name: params.order } }, { warehouse: { code: "asc" } }],
      ...pagination(params),
      include: {
        product: { select: { sku: true, name: true, unit: true, minStock: true } },
        warehouse: { select: { code: true, name: true } },
      },
    }),
    prisma.stock.count({ where }),
  ]);

  return paginate(
    rows.map((stock) => ({
      productId: stock.productId,
      sku: stock.product.sku,
      productName: stock.product.name,
      unit: stock.product.unit,
      minStock: stock.product.minStock,
      warehouseId: stock.warehouseId,
      warehouseCode: stock.warehouse.code,
      warehouseName: stock.warehouse.name,
      quantity: stock.quantity,
      updatedAt: stock.updatedAt,
    })),
    total,
    params,
  );
}
