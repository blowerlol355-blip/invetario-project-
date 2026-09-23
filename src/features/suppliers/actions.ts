"use server";

import { revalidatePath } from "next/cache";

import { type SupplierInput, supplierSchema } from "@/features/suppliers/schemas";
import { type ActionResult, fail, ok, toActionError } from "@/lib/action-result";
import { type DbClient, recordAudit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { BusinessRuleError, NotFoundError } from "@/lib/errors";

const ENTITY = "Supplier";
const OPEN_ORDER_STATUSES = ["DRAFT", "SENT", "PARTIALLY_RECEIVED"];

function toData(input: SupplierInput) {
  return {
    name: input.name,
    contactName: input.contactName || null,
    email: input.email ? input.email.toLowerCase() : null,
    phone: input.phone || null,
    address: input.address || null,
    taxId: input.taxId ? input.taxId.toUpperCase() : null,
  };
}

/**
 * La unicidad de taxId se valida aquí porque los índices únicos de SQL Server
 * no admiten varios NULL (ver docs/DATABASE.md).
 */
async function assertTaxIdAvailable(db: DbClient, taxId: string | null, excludeId?: string) {
  if (!taxId) return;
  const existing = await db.supplier.findFirst({
    where: { taxId, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
    select: { id: true },
  });
  if (existing) {
    throw new DuplicateTaxIdError();
  }
}

class DuplicateTaxIdError extends Error {}
const TAX_ID_MESSAGE = "Ya existe un proveedor con esa identificación fiscal.";

function handleError<T>(error: unknown): ActionResult<T> {
  if (error instanceof DuplicateTaxIdError) {
    return fail(TAX_ID_MESSAGE, { taxId: [TAX_ID_MESSAGE] });
  }
  return toActionError(error);
}

export async function createSupplierAction(
  input: SupplierInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requirePermission("catalogs:manage");
    const data = toData(supplierSchema.parse(input));

    const supplier = await prisma.$transaction(async (tx) => {
      await assertTaxIdAvailable(tx, data.taxId);
      const created = await tx.supplier.create({ data });
      await recordAudit(tx, {
        userId: session.user.id,
        action: "CREATE",
        entity: ENTITY,
        entityId: created.id,
        after: created,
      });
      return created;
    });

    revalidatePath("/suppliers");
    return ok({ id: supplier.id });
  } catch (error) {
    return handleError(error);
  }
}

export async function updateSupplierAction(
  id: string,
  input: SupplierInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requirePermission("catalogs:manage");
    const data = toData(supplierSchema.parse(input));

    await prisma.$transaction(async (tx) => {
      const before = await tx.supplier.findUnique({ where: { id } });
      if (!before) throw new NotFoundError();
      await assertTaxIdAvailable(tx, data.taxId, id);
      const after = await tx.supplier.update({ where: { id }, data });
      await recordAudit(tx, {
        userId: session.user.id,
        action: "UPDATE",
        entity: ENTITY,
        entityId: id,
        before,
        after,
      });
    });

    revalidatePath("/suppliers");
    return ok({ id });
  } catch (error) {
    return handleError(error);
  }
}

/** Activa o desactiva (soft delete) un proveedor. */
export async function setSupplierActiveAction(
  id: string,
  isActive: boolean,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requirePermission("catalogs:manage");

    await prisma.$transaction(async (tx) => {
      const before = await tx.supplier.findUnique({ where: { id } });
      if (!before) throw new NotFoundError();

      if (!isActive) {
        const openOrders = await tx.purchaseOrder.count({
          where: { supplierId: id, status: { in: OPEN_ORDER_STATUSES } },
        });
        if (openOrders > 0) {
          throw new BusinessRuleError(
            `No se puede desactivar: el proveedor tiene ${openOrders} orden(es) de compra abierta(s). Recíbelas o cancélalas primero.`,
          );
        }
      }

      const after = await tx.supplier.update({ where: { id }, data: { isActive } });
      await recordAudit(tx, {
        userId: session.user.id,
        action: isActive ? "UPDATE" : "DELETE",
        entity: ENTITY,
        entityId: id,
        before: { isActive: before.isActive },
        after: { isActive: after.isActive },
      });
    });

    revalidatePath("/suppliers");
    return ok({ id });
  } catch (error) {
    return toActionError(error);
  }
}
