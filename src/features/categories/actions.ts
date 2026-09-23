"use server";

import { revalidatePath } from "next/cache";

import { type CategoryInput, categorySchema } from "@/features/categories/schemas";
import { type ActionResult, ok, toActionError } from "@/lib/action-result";
import { recordAudit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { BusinessRuleError, NotFoundError } from "@/lib/errors";

const UNIQUE_MESSAGES = { name: "Ya existe una categoría con ese nombre." };
const ENTITY = "Category";

function toData(input: CategoryInput) {
  return { name: input.name, description: input.description || null };
}

export async function createCategoryAction(
  input: CategoryInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requirePermission("catalogs:manage");
    const data = toData(categorySchema.parse(input));

    const category = await prisma.$transaction(async (tx) => {
      const created = await tx.category.create({ data });
      await recordAudit(tx, {
        userId: session.user.id,
        action: "CREATE",
        entity: ENTITY,
        entityId: created.id,
        after: created,
      });
      return created;
    });

    revalidatePath("/categories");
    return ok({ id: category.id });
  } catch (error) {
    return toActionError(error, { unique: UNIQUE_MESSAGES });
  }
}

export async function updateCategoryAction(
  id: string,
  input: CategoryInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requirePermission("catalogs:manage");
    const data = toData(categorySchema.parse(input));

    await prisma.$transaction(async (tx) => {
      const before = await tx.category.findUnique({ where: { id } });
      if (!before) throw new NotFoundError();
      const after = await tx.category.update({ where: { id }, data });
      await recordAudit(tx, {
        userId: session.user.id,
        action: "UPDATE",
        entity: ENTITY,
        entityId: id,
        before,
        after,
      });
    });

    revalidatePath("/categories");
    return ok({ id });
  } catch (error) {
    return toActionError(error, { unique: UNIQUE_MESSAGES });
  }
}

/** Activa o desactiva (soft delete) una categoría. */
export async function setCategoryActiveAction(
  id: string,
  isActive: boolean,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requirePermission("catalogs:manage");

    await prisma.$transaction(async (tx) => {
      const before = await tx.category.findUnique({
        where: { id },
        include: { _count: { select: { products: { where: { isActive: true } } } } },
      });
      if (!before) throw new NotFoundError();
      if (!isActive && before._count.products > 0) {
        throw new BusinessRuleError(
          `No se puede desactivar: la categoría tiene ${before._count.products} producto(s) activo(s). Reasigna o desactiva esos productos primero.`,
        );
      }
      const after = await tx.category.update({ where: { id }, data: { isActive } });
      await recordAudit(tx, {
        userId: session.user.id,
        action: isActive ? "UPDATE" : "DELETE",
        entity: ENTITY,
        entityId: id,
        before: { isActive: before.isActive },
        after: { isActive: after.isActive },
      });
    });

    revalidatePath("/categories");
    return ok({ id });
  } catch (error) {
    return toActionError(error);
  }
}
