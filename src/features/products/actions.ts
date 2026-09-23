"use server";

import { revalidatePath } from "next/cache";

import { type ProductInput, productSchema } from "@/features/products/schemas";
import {
  BARCODE_MESSAGE,
  createProduct,
  DuplicateBarcodeError,
  updateProduct,
} from "@/features/products/service";
import { type ActionResult, fail, ok, toActionError } from "@/lib/action-result";
import { recordAudit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { BusinessRuleError, NotFoundError } from "@/lib/errors";

const ENTITY = "Product";
const UNIQUE_MESSAGES = { sku: "Ya existe un producto con ese SKU." };

function handleError<T>(error: unknown): ActionResult<T> {
  if (error instanceof DuplicateBarcodeError) {
    return fail(BARCODE_MESSAGE, { barcode: [BARCODE_MESSAGE] });
  }
  return toActionError(error, { unique: UNIQUE_MESSAGES });
}

function revalidateProduct(id?: string) {
  revalidatePath("/products");
  if (id) revalidatePath(`/products/${id}`);
}

export async function createProductAction(
  input: ProductInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requirePermission("products:manage");
    const product = await createProduct(productSchema.parse(input), session.user.id);
    revalidateProduct(product.id);
    return ok({ id: product.id });
  } catch (error) {
    return handleError(error);
  }
}

export async function updateProductAction(
  id: string,
  input: ProductInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requirePermission("products:manage");
    await updateProduct(id, productSchema.parse(input), session.user.id);
    revalidateProduct(id);
    return ok({ id });
  } catch (error) {
    return handleError(error);
  }
}

/** Activa o desactiva (soft delete) un producto. No se desactiva con existencias. */
export async function setProductActiveAction(
  id: string,
  isActive: boolean,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requirePermission("products:manage");

    await prisma.$transaction(async (tx) => {
      const before = await tx.product.findUnique({ where: { id } });
      if (!before) throw new NotFoundError();

      if (!isActive) {
        const stock = await tx.stock.aggregate({
          where: { productId: id },
          _sum: { quantity: true },
        });
        const units = stock._sum.quantity ?? 0;
        if (units > 0) {
          throw new BusinessRuleError(
            `No se puede desactivar: el producto tiene ${units} unidad(es) en existencia. Da salida al stock primero.`,
          );
        }
      }

      const after = await tx.product.update({ where: { id }, data: { isActive } });
      await recordAudit(tx, {
        userId: session.user.id,
        action: isActive ? "UPDATE" : "DELETE",
        entity: ENTITY,
        entityId: id,
        before: { isActive: before.isActive },
        after: { isActive: after.isActive },
      });
    });

    revalidateProduct(id);
    return ok({ id });
  } catch (error) {
    return toActionError(error);
  }
}
