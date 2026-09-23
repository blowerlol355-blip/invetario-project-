import "server-only";

import type { UserFilters } from "@/features/users/schemas";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import type { UserRole } from "@/lib/domain";
import {
  type ListParams,
  paginate,
  type Paginated,
  pagination,
  resolveSort,
  statusWhere,
} from "@/lib/query-params";

export interface UserRow {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  hasApiKey: boolean;
  apiKeyCreatedAt: Date | null;
  movementCount: number;
  createdAt: Date;
}

export const USER_SORTS = ["name", "email", "role", "createdAt"] as const;

export async function listUsers(
  params: ListParams,
  filters: UserFilters,
): Promise<Paginated<UserRow>> {
  const sort = resolveSort(params.sort, USER_SORTS, "name");
  const where: Prisma.UserWhereInput = {
    ...statusWhere(params.status),
    ...(filters.role ? { role: filters.role } : {}),
    ...(params.q
      ? { OR: [{ name: { contains: params.q } }, { email: { contains: params.q } }] }
      : {}),
  };

  const [rows, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      orderBy: { [sort]: params.order },
      ...pagination(params),
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        apiKeyHash: true,
        apiKeyCreatedAt: true,
        createdAt: true,
        _count: { select: { movements: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return paginate(
    rows.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as UserRole,
      isActive: user.isActive,
      hasApiKey: user.apiKeyHash !== null,
      apiKeyCreatedAt: user.apiKeyCreatedAt,
      movementCount: user._count.movements,
      createdAt: user.createdAt,
    })),
    total,
    params,
  );
}
