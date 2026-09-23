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

export interface CategoryRow {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  productCount: number;
}

export const CATEGORY_SORTS = ["name", "createdAt", "productCount"] as const;

export async function listCategories(params: ListParams): Promise<Paginated<CategoryRow>> {
  const sort = resolveSort(params.sort, CATEGORY_SORTS, "name");
  const where: Prisma.CategoryWhereInput = {
    ...statusWhere(params.status),
    ...(params.q
      ? {
          OR: [
            { name: { contains: params.q, mode: "insensitive" } },
            { description: { contains: params.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const orderBy: Prisma.CategoryOrderByWithRelationInput =
    sort === "productCount" ? { products: { _count: params.order } } : { [sort]: params.order };

  const [rows, total] = await prisma.$transaction([
    prisma.category.findMany({
      where,
      orderBy,
      ...pagination(params),
      include: { _count: { select: { products: true } } },
    }),
    prisma.category.count({ where }),
  ]);

  return paginate(
    rows.map(({ _count, ...category }) => ({ ...category, productCount: _count.products })),
    total,
    params,
  );
}

export interface CategoryOption {
  id: string;
  name: string;
}

/** Categorías activas para selects (productos). */
export async function getCategoryOptions(): Promise<CategoryOption[]> {
  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}
