import "server-only";

import type { AuditFilters } from "@/features/audit/schemas";
import { dateRangeWhere } from "@/features/stock/queries";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import type { AuditAction } from "@/lib/domain";
import { type ListParams, paginate, type Paginated, pagination } from "@/lib/query-params";

export interface AuditRow {
  id: string;
  userId: string | null;
  userName: string | null;
  action: AuditAction;
  entity: string;
  entityId: string;
  /** Nombre legible de la entidad (SKU, código, nombre...) si todavía existe. */
  entityLabel: string | null;
  before: string | null;
  after: string | null;
  createdAt: Date;
}

export function buildAuditWhere(
  params: Pick<ListParams, "q">,
  filters: AuditFilters,
): Prisma.AuditLogWhereInput {
  const createdAt = dateRangeWhere(filters.from, filters.to);
  return {
    ...(filters.entity ? { entity: filters.entity } : {}),
    ...(filters.action ? { action: filters.action } : {}),
    ...(filters.userId ? { userId: filters.userId } : {}),
    ...(createdAt ? { createdAt } : {}),
    ...(params.q
      ? {
          OR: [
            { entityId: { contains: params.q } },
            { user: { name: { contains: params.q } } },
            { before: { contains: params.q } },
            { after: { contains: params.q } },
          ],
        }
      : {}),
  };
}

/**
 * Resuelve un nombre legible para cada (entidad, id) de la página: una consulta por
 * tipo de entidad presente, nunca una por fila.
 */
async function resolveEntityLabels(
  rows: { entity: string; entityId: string }[],
): Promise<Map<string, string>> {
  const idsByEntity = new Map<string, string[]>();
  for (const row of rows) {
    const ids = idsByEntity.get(row.entity) ?? [];
    if (!ids.includes(row.entityId)) ids.push(row.entityId);
    idsByEntity.set(row.entity, ids);
  }

  const labels = new Map<string, string>();
  const set = (entity: string, id: string, label: string) => labels.set(`${entity}:${id}`, label);

  await Promise.all(
    [...idsByEntity.entries()].map(async ([entity, ids]) => {
      const where = { id: { in: ids } };
      switch (entity) {
        case "Category": {
          const items = await prisma.category.findMany({ where, select: { id: true, name: true } });
          items.forEach((item) => set(entity, item.id, item.name));
          break;
        }
        case "Supplier": {
          const items = await prisma.supplier.findMany({ where, select: { id: true, name: true } });
          items.forEach((item) => set(entity, item.id, item.name));
          break;
        }
        case "Warehouse": {
          const items = await prisma.warehouse.findMany({
            where,
            select: { id: true, code: true, name: true },
          });
          items.forEach((item) => set(entity, item.id, `${item.code} · ${item.name}`));
          break;
        }
        case "Product": {
          const items = await prisma.product.findMany({
            where,
            select: { id: true, sku: true, name: true },
          });
          items.forEach((item) => set(entity, item.id, `${item.sku} · ${item.name}`));
          break;
        }
        case "StockMovement": {
          const items = await prisma.stockMovement.findMany({
            where,
            select: { id: true, quantity: true, product: { select: { sku: true } } },
          });
          items.forEach((item) => set(entity, item.id, `${item.product.sku} × ${item.quantity}`));
          break;
        }
        case "PurchaseOrder": {
          const items = await prisma.purchaseOrder.findMany({
            where,
            select: { id: true, code: true },
          });
          items.forEach((item) => set(entity, item.id, item.code));
          break;
        }
        case "User": {
          const items = await prisma.user.findMany({ where, select: { id: true, name: true } });
          items.forEach((item) => set(entity, item.id, item.name));
          break;
        }
      }
    }),
  );

  return labels;
}

export async function listAuditLogs(
  params: ListParams,
  filters: AuditFilters,
): Promise<Paginated<AuditRow>> {
  const where = buildAuditWhere(params, filters);
  const [rows, total] = await prisma.$transaction([
    prisma.auditLog.findMany({
      where,
      orderBy: [{ createdAt: params.order === "asc" ? "asc" : "desc" }, { id: "desc" }],
      ...pagination(params),
      include: { user: { select: { name: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);
  const labels = await resolveEntityLabels(rows);

  return paginate(
    rows.map((log) => ({
      id: log.id,
      userId: log.userId,
      userName: log.user?.name ?? null,
      action: log.action as AuditAction,
      entity: log.entity,
      entityId: log.entityId,
      entityLabel: labels.get(`${log.entity}:${log.entityId}`) ?? null,
      before: log.before,
      after: log.after,
      createdAt: log.createdAt,
    })),
    total,
    params,
  );
}
