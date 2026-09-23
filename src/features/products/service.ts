import "server-only";

import type { ProductInput } from "@/features/products/schemas";
import { type DbClient, recordAudit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { BusinessRuleError, ConflictError, NotFoundError } from "@/lib/errors";

/**
 * Lógica de creación y edición de productos compartida por las Server Actions
 * y la API REST. Toda escritura va con su entrada de auditoría en la misma transacción.
 */

const ENTITY = "Product";
export const BARCODE_MESSAGE = "Ya existe un producto con ese código de barras.";

/** Código de barras duplicado (columna opcional: la unicidad se valida aquí, no en SQL). */
export class DuplicateBarcodeError extends ConflictError {
  constructor() {
    super(BARCODE_MESSAGE);
    this.name = "DuplicateBarcodeError";
  }
}

export function toProductData(input: ProductInput) {
  return {
    sku: input.sku.toUpperCase(),
    barcode: input.barcode || null,
    name: input.name,
    description: input.description || null,
    categoryId: input.categoryId,
    supplierId: input.supplierId || null,
    unit: input.unit,
    costPrice: input.costPrice,
    salePrice: input.salePrice,
    minStock: input.minStock,
    maxStock: input.maxStock,
    imageUrl: input.imageUrl || null,
  };
}

/** Comprueba que categoría y proveedor existan y estén activos. */
async function assertReferences(db: DbClient, categoryId: string, supplierId: string | null) {
  const category = await db.category.findUnique({ where: { id: categoryId } });
  if (!category || !category.isActive) {
    throw new BusinessRuleError("La categoría seleccionada no existe o está inactiva.");
  }
  if (supplierId) {
    const supplier = await db.supplier.findUnique({ where: { id: supplierId } });
    if (!supplier || !supplier.isActive) {
      throw new BusinessRuleError("El proveedor seleccionado no existe o está inactivo.");
    }
  }
}

async function assertBarcodeAvailable(db: DbClient, barcode: string | null, excludeId?: string) {
  if (!barcode) return;
  const existing = await db.product.findFirst({
    where: { barcode, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
    select: { id: true },
  });
  if (existing) throw new DuplicateBarcodeError();
}

/** Crea un producto validado (`productSchema.parse` previo) y lo audita. */
export async function createProduct(input: ProductInput, userId: string): Promise<{ id: string }> {
  const data = toProductData(input);
  return prisma.$transaction(async (tx) => {
    await assertReferences(tx, data.categoryId, data.supplierId);
    await assertBarcodeAvailable(tx, data.barcode);
    const created = await tx.product.create({ data });
    await recordAudit(tx, {
      userId,
      action: "CREATE",
      entity: ENTITY,
      entityId: created.id,
      after: created,
    });
    return { id: created.id };
  });
}

/** Actualiza un producto validado y lo audita con el antes y el después. */
export async function updateProduct(
  id: string,
  input: ProductInput,
  userId: string,
): Promise<{ id: string }> {
  const data = toProductData(input);
  await prisma.$transaction(async (tx) => {
    const before = await tx.product.findUnique({ where: { id } });
    if (!before) throw new NotFoundError();
    // Solo se exige categoría/proveedor activos si cambian; así se puede editar un
    // producto cuyo catálogo se desactivó después.
    if (before.categoryId !== data.categoryId || before.supplierId !== data.supplierId) {
      await assertReferences(
        tx,
        data.categoryId,
        before.supplierId !== data.supplierId ? data.supplierId : null,
      );
    }
    await assertBarcodeAvailable(tx, data.barcode, id);
    const after = await tx.product.update({ where: { id }, data });
    await recordAudit(tx, {
      userId,
      action: "UPDATE",
      entity: ENTITY,
      entityId: id,
      before,
      after,
    });
  });
  return { id };
}
