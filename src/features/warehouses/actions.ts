"use server";

import { revalidatePath } from "next/cache";

import { type WarehouseInput, warehouseSchema } from "@/features/warehouses/schemas";
import { type ActionResult, ok, toActionError } from "@/lib/action-result";
import { recordAudit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { BusinessRuleError, NotFoundError } from "@/lib/errors";

const ENTITY = "Warehouse";
const UNIQUE_MESSAGES = { code: "Ya existe un almacén con ese código." };

function toData(input: WarehouseInput) {
  return {
    code: input.code.toUpperCase(),
    name: input.name,
    address: input.address || null,
  };
}

export async function createWarehouseAction(
  input: WarehouseInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requirePermission("catalogs:manage");
    const data = toData(warehouseSchema.parse(input));

    const warehouse = await prisma.$transaction(async (tx) => {
      const created = await tx.warehouse.create({ data });
      await recordAudit(tx, {
        userId: session.user.id,
        action: "CREATE",
        entity: ENTITY,
        entityId: created.id,
        after: created,
      });
      return created;
    });

    revalidatePath("/warehouses");
    return ok({ id: warehouse.id });
  } catch (error) {
    return toActionError(error, { unique: UNIQUE_MESSAGES });
  }
}

export async function updateWarehouseAction(
  id: string,
  input: WarehouseInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requirePermission("catalogs:manage");
    const data = toData(warehouseSchema.parse(input));

    await prisma.$transaction(async (tx) => {
      const before = await tx.warehouse.findUnique({ where: { id } });
      if (!before) throw new NotFoundError();
      const after = await tx.warehouse.update({ where: { id }, data });
      await recordAudit(tx, {
        userId: session.user.id,
        action: "UPDATE",
        entity: ENTITY,
        entityId: id,
        before,
        after,
      });
    });

    revalidatePath("/warehouses");
    return ok({ id });
  } catch (error) {
    return toActionError(error, { unique: UNIQUE_MESSAGES });
  }
}

/** Activa o desactiva (soft delete) un almacén. No se puede desactivar con existencias. */
export async function setWarehouseActiveAction(
  id: string,
  isActive: boolean,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requirePermission("catalogs:manage");

    await prisma.$transaction(async (tx) => {
      const before = await tx.warehouse.findUnique({ where: { id } });
      if (!before) throw new NotFoundError();

      if (!isActive) {
        const stock = await tx.stock.aggregate({
          where: { warehouseId: id },
          _sum: { quantity: true },
        });
        const units = stock._sum.quantity ?? 0;
        if (units > 0) {
          throw new BusinessRuleError(
            `No se puede desactivar: el almacén tiene ${units} unidad(es) en existencia. Transfiere o da salida al stock primero.`,
          );
        }
      }

      const after = await tx.warehouse.update({ where: { id }, data: { isActive } });
      await recordAudit(tx, {
        userId: session.user.id,
        action: isActive ? "UPDATE" : "DELETE",
        entity: ENTITY,
        entityId: id,
        before: { isActive: before.isActive },
        after: { isActive: after.isActive },
      });
    });

    revalidatePath("/warehouses");
    return ok({ id });
  } catch (error) {
    return toActionError(error);
  }
}
