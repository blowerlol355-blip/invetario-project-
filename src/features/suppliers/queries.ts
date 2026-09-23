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

export interface SupplierRow {
  id: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  taxId: string | null;
  isActive: boolean;
  createdAt: Date;
  productCount: number;
}

export const SUPPLIER_SORTS = [
  "name",
  "contactName",
  "email",
  "createdAt",
  "productCount",
] as const;

export async function listSuppliers(params: ListParams): Promise<Paginated<SupplierRow>> {
  const sort = resolveSort(params.sort, SUPPLIER_SORTS, "name");
  const where: Prisma.SupplierWhereInput = {
    ...statusWhere(params.status),
    ...(params.q
      ? {
          OR: [
            { name: { contains: params.q } },
            { contactName: { contains: params.q } },
            { email: { contains: params.q } },
            { taxId: { contains: params.q } },
          ],
        }
      : {}),
  };
  const orderBy: Prisma.SupplierOrderByWithRelationInput =
    sort === "productCount" ? { products: { _count: params.order } } : { [sort]: params.order };

  const [rows, total] = await prisma.$transaction([
    prisma.supplier.findMany({
      where,
      orderBy,
      ...pagination(params),
      include: { _count: { select: { products: true } } },
    }),
    prisma.supplier.count({ where }),
  ]);

  return paginate(
    rows.map(({ _count, ...supplier }) => ({ ...supplier, productCount: _count.products })),
    total,
    params,
  );
}

export interface SupplierOption {
  id: string;
  name: string;
}

/** Proveedores activos para selects (productos, órdenes de compra). */
export async function getSupplierOptions(): Promise<SupplierOption[]> {
  return prisma.supplier.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}
