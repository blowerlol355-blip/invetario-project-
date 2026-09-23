import "server-only";

import type { PurchaseOrderFilters } from "@/features/purchase-orders/schemas";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import type { PurchaseOrderStatus } from "@/lib/domain";
import {
  type ListParams,
  paginate,
  type Paginated,
  pagination,
  resolveSort,
} from "@/lib/query-params";

export interface PurchaseOrderRow {
  id: string;
  code: string;
  status: PurchaseOrderStatus;
  supplierName: string;
  warehouseCode: string;
  warehouseName: string;
  createdByName: string;
  itemCount: number;
  quantityOrdered: number;
  quantityReceived: number;
  total: number;
  expectedDate: Date | null;
  createdAt: Date;
}

export const PURCHASE_ORDER_SORTS = ["code", "createdAt", "expectedDate", "status"] as const;

function summarize(
  items: { quantityOrdered: number; quantityReceived: number; unitCost: unknown }[],
) {
  return items.reduce(
    (acc, item) => ({
      itemCount: acc.itemCount + 1,
      quantityOrdered: acc.quantityOrdered + item.quantityOrdered,
      quantityReceived: acc.quantityReceived + item.quantityReceived,
      total: acc.total + item.quantityOrdered * Number(item.unitCost),
    }),
    { itemCount: 0, quantityOrdered: 0, quantityReceived: 0, total: 0 },
  );
}

export async function listPurchaseOrders(
  params: ListParams,
  filters: PurchaseOrderFilters,
): Promise<Paginated<PurchaseOrderRow>> {
  const sort = resolveSort(params.sort, PURCHASE_ORDER_SORTS, "createdAt");
  const where: Prisma.PurchaseOrderWhereInput = {
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.supplierId ? { supplierId: filters.supplierId } : {}),
    ...(filters.warehouseId ? { warehouseId: filters.warehouseId } : {}),
    ...(params.q
      ? {
          OR: [
            { code: { contains: params.q, mode: "insensitive" } },
            { supplier: { name: { contains: params.q, mode: "insensitive" } } },
            { notes: { contains: params.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [rows, total] = await prisma.$transaction([
    prisma.purchaseOrder.findMany({
      where,
      orderBy: { [sort]: params.order },
      ...pagination(params),
      include: {
        supplier: { select: { name: true } },
        warehouse: { select: { code: true, name: true } },
        createdBy: { select: { name: true } },
        items: { select: { quantityOrdered: true, quantityReceived: true, unitCost: true } },
      },
    }),
    prisma.purchaseOrder.count({ where }),
  ]);

  return paginate(
    rows.map((order) => ({
      id: order.id,
      code: order.code,
      status: order.status as PurchaseOrderStatus,
      supplierName: order.supplier.name,
      warehouseCode: order.warehouse.code,
      warehouseName: order.warehouse.name,
      createdByName: order.createdBy.name,
      expectedDate: order.expectedDate,
      createdAt: order.createdAt,
      ...summarize(order.items),
    })),
    total,
    params,
  );
}

export interface PurchaseOrderItemDetail {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  unit: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitCost: number;
}

export interface PurchaseOrderDetail {
  id: string;
  code: string;
  status: PurchaseOrderStatus;
  supplier: { id: string; name: string; contactName: string | null; email: string | null };
  warehouse: { id: string; code: string; name: string };
  createdBy: { id: string; name: string };
  expectedDate: Date | null;
  notes: string | null;
  sentAt: Date | null;
  receivedAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  items: PurchaseOrderItemDetail[];
  quantityOrdered: number;
  quantityReceived: number;
  total: number;
}

export async function getPurchaseOrderDetail(id: string): Promise<PurchaseOrderDetail | null> {
  const order = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      supplier: { select: { id: true, name: true, contactName: true, email: true } },
      warehouse: { select: { id: true, code: true, name: true } },
      createdBy: { select: { id: true, name: true } },
      items: {
        include: { product: { select: { name: true, sku: true, unit: true } } },
        orderBy: { product: { name: "asc" } },
      },
    },
  });
  if (!order) return null;

  const items = order.items.map((item) => ({
    id: item.id,
    productId: item.productId,
    productName: item.product.name,
    sku: item.product.sku,
    unit: item.product.unit,
    quantityOrdered: item.quantityOrdered,
    quantityReceived: item.quantityReceived,
    unitCost: Number(item.unitCost),
  }));

  return {
    id: order.id,
    code: order.code,
    status: order.status as PurchaseOrderStatus,
    supplier: order.supplier,
    warehouse: order.warehouse,
    createdBy: order.createdBy,
    expectedDate: order.expectedDate,
    notes: order.notes,
    sentAt: order.sentAt,
    receivedAt: order.receivedAt,
    cancelledAt: order.cancelledAt,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    items,
    ...summarize(items),
  };
}

/** Orden en el formato del formulario de edición (solo borradores). */
export async function getPurchaseOrderForEdit(id: string) {
  const order = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: { items: { select: { productId: true, quantityOrdered: true, unitCost: true } } },
  });
  if (!order) return null;
  return {
    id: order.id,
    code: order.code,
    status: order.status as PurchaseOrderStatus,
    values: {
      supplierId: order.supplierId,
      warehouseId: order.warehouseId,
      expectedDate: order.expectedDate ? order.expectedDate.toISOString().slice(0, 10) : "",
      notes: order.notes ?? "",
      items: order.items.map((item) => ({
        productId: item.productId,
        quantityOrdered: item.quantityOrdered,
        unitCost: Number(item.unitCost),
      })),
    },
  };
}
