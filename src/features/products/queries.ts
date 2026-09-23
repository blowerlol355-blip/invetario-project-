import "server-only";

import type { ProductFilters } from "@/features/products/schemas";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import type { MovementType } from "@/lib/domain";
import {
  type ListParams,
  paginate,
  type Paginated,
  pagination,
  resolveSort,
  statusWhere,
} from "@/lib/query-params";

export interface ProductRow {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  unit: string;
  categoryName: string;
  supplierName: string | null;
  costPrice: number;
  salePrice: number;
  avgCost: number;
  minStock: number;
  maxStock: number | null;
  totalStock: number;
  isActive: boolean;
  createdAt: Date;
}

export const PRODUCT_SORTS = [
  "sku",
  "name",
  "category",
  "costPrice",
  "salePrice",
  "minStock",
  "createdAt",
] as const;

export async function listProducts(
  params: ListParams,
  filters: ProductFilters,
): Promise<Paginated<ProductRow>> {
  const sort = resolveSort(params.sort, PRODUCT_SORTS, "name");
  const where: Prisma.ProductWhereInput = {
    ...statusWhere(params.status),
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    ...(filters.supplierId ? { supplierId: filters.supplierId } : {}),
    ...(params.q
      ? {
          OR: [
            { name: { contains: params.q, mode: "insensitive" } },
            { sku: { contains: params.q, mode: "insensitive" } },
            { barcode: { contains: params.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const orderBy: Prisma.ProductOrderByWithRelationInput =
    sort === "category" ? { category: { name: params.order } } : { [sort]: params.order };

  const [rows, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      orderBy,
      ...pagination(params),
      include: {
        category: { select: { name: true } },
        supplier: { select: { name: true } },
        stocks: { select: { quantity: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return paginate(
    rows.map((product) => ({
      id: product.id,
      sku: product.sku,
      barcode: product.barcode,
      name: product.name,
      unit: product.unit,
      categoryName: product.category.name,
      supplierName: product.supplier?.name ?? null,
      costPrice: Number(product.costPrice),
      salePrice: Number(product.salePrice),
      avgCost: Number(product.avgCost),
      minStock: product.minStock,
      maxStock: product.maxStock,
      totalStock: product.stocks.reduce((sum, stock) => sum + stock.quantity, 0),
      isActive: product.isActive,
      createdAt: product.createdAt,
    })),
    total,
    params,
  );
}

export interface ProductDetail {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  description: string | null;
  unit: string;
  imageUrl: string | null;
  category: { id: string; name: string; isActive: boolean };
  supplier: { id: string; name: string; isActive: boolean } | null;
  costPrice: number;
  salePrice: number;
  avgCost: number;
  minStock: number;
  maxStock: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  totalStock: number;
  stocks: { warehouseId: string; warehouseCode: string; warehouseName: string; quantity: number }[];
}

export async function getProductDetail(id: string): Promise<ProductDetail | null> {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, name: true, isActive: true } },
      supplier: { select: { id: true, name: true, isActive: true } },
      stocks: {
        include: { warehouse: { select: { code: true, name: true } } },
        orderBy: { warehouse: { code: "asc" } },
      },
    },
  });
  if (!product) return null;

  return {
    id: product.id,
    sku: product.sku,
    barcode: product.barcode,
    name: product.name,
    description: product.description,
    unit: product.unit,
    imageUrl: product.imageUrl,
    category: product.category,
    supplier: product.supplier,
    costPrice: Number(product.costPrice),
    salePrice: Number(product.salePrice),
    avgCost: Number(product.avgCost),
    minStock: product.minStock,
    maxStock: product.maxStock,
    isActive: product.isActive,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    totalStock: product.stocks.reduce((sum, stock) => sum + stock.quantity, 0),
    stocks: product.stocks.map((stock) => ({
      warehouseId: stock.warehouseId,
      warehouseCode: stock.warehouse.code,
      warehouseName: stock.warehouse.name,
      quantity: stock.quantity,
    })),
  };
}

export interface ProductMovementRow {
  id: string;
  type: MovementType;
  quantity: number;
  unitCost: number | null;
  fromWarehouse: string | null;
  toWarehouse: string | null;
  reason: string | null;
  reference: string | null;
  userName: string;
  createdAt: Date;
}

/** Historial de movimientos de un producto, del más reciente al más antiguo. */
export async function listProductMovements(
  productId: string,
  params: ListParams,
): Promise<Paginated<ProductMovementRow>> {
  const where: Prisma.StockMovementWhereInput = { productId };
  const [rows, total] = await prisma.$transaction([
    prisma.stockMovement.findMany({
      where,
      orderBy: { createdAt: params.order === "asc" ? "asc" : "desc" },
      ...pagination(params),
      include: {
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
      quantity: movement.quantity,
      unitCost: movement.unitCost === null ? null : Number(movement.unitCost),
      fromWarehouse: movement.fromWarehouse?.code ?? null,
      toWarehouse: movement.toWarehouse?.code ?? null,
      reason: movement.reason,
      reference: movement.reference,
      userName: movement.user.name,
      createdAt: movement.createdAt,
    })),
    total,
    params,
  );
}

/** Datos de un producto en el formato del formulario de edición. */
export async function getProductForEdit(id: string) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return null;
  return {
    id: product.id,
    values: {
      sku: product.sku,
      barcode: product.barcode ?? "",
      name: product.name,
      description: product.description ?? "",
      categoryId: product.categoryId,
      supplierId: product.supplierId ?? "",
      unit: product.unit,
      costPrice: Number(product.costPrice),
      salePrice: Number(product.salePrice),
      minStock: product.minStock,
      maxStock: product.maxStock,
      imageUrl: product.imageUrl ?? "",
    },
  };
}
