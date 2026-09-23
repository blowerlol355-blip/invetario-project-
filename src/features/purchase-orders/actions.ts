"use server";

import { revalidatePath } from "next/cache";

import { planReceipt } from "@/features/purchase-orders/lib/receipt";
import { assertCanPerform, buildPurchaseOrderCode } from "@/features/purchase-orders/lib/status";
import {
  type PurchaseOrderInput,
  purchaseOrderSchema,
  type ReceiveItemsInput,
  receiveItemsSchema,
} from "@/features/purchase-orders/schemas";
import { applyStockMovement } from "@/features/stock/lib/apply-movement";
import { type ActionResult, ok, toActionError } from "@/lib/action-result";
import { type DbClient, recordAudit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { BusinessRuleError, NotFoundError } from "@/lib/errors";
import { withSerializableTransaction } from "@/lib/transaction";

const ENTITY = "PurchaseOrder";

function revalidateOrder(id?: string) {
  revalidatePath("/purchase-orders");
  if (id) revalidatePath(`/purchase-orders/${id}`);
  revalidatePath("/alerts");
  revalidatePath("/dashboard");
}

function toOrderData(input: PurchaseOrderInput) {
  return {
    supplierId: input.supplierId,
    warehouseId: input.warehouseId,
    expectedDate: input.expectedDate ? new Date(`${input.expectedDate}T00:00:00`) : null,
    notes: input.notes || null,
  };
}

/** Proveedor, almacén y productos deben existir y estar activos. */
async function assertReferences(db: DbClient, input: PurchaseOrderInput) {
  const [supplier, warehouse, products] = await Promise.all([
    db.supplier.findUnique({ where: { id: input.supplierId } }),
    db.warehouse.findUnique({ where: { id: input.warehouseId } }),
    db.product.findMany({
      where: { id: { in: input.items.map((item) => item.productId) } },
      select: { id: true, name: true, isActive: true },
    }),
  ]);
  if (!supplier?.isActive) throw new BusinessRuleError("El proveedor no existe o está inactivo.");
  if (!warehouse?.isActive) throw new BusinessRuleError("El almacén no existe o está inactivo.");
  for (const item of input.items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) throw new BusinessRuleError("Uno de los productos no existe.");
    if (!product.isActive) {
      throw new BusinessRuleError(`El producto "${product.name}" está inactivo.`);
    }
  }
}

export async function createPurchaseOrderAction(
  input: PurchaseOrderInput,
): Promise<ActionResult<{ id: string; code: string }>> {
  try {
    const session = await requirePermission("purchase-orders:manage");
    const values = purchaseOrderSchema.parse(input);

    const order = await withSerializableTransaction(async (tx) => {
      await assertReferences(tx, values);
      const year = new Date().getFullYear();
      const last = await tx.purchaseOrder.findFirst({
        where: { code: { startsWith: `OC-${year}-` } },
        orderBy: { code: "desc" },
        select: { code: true },
      });
      const created = await tx.purchaseOrder.create({
        data: {
          code: buildPurchaseOrderCode(year, last?.code ?? null),
          ...toOrderData(values),
          status: "DRAFT",
          createdById: session.user.id,
          items: { create: values.items },
        },
        include: { items: true },
      });
      await recordAudit(tx, {
        userId: session.user.id,
        action: "CREATE",
        entity: ENTITY,
        entityId: created.id,
        after: created,
      });
      return created;
    });

    revalidateOrder(order.id);
    return ok({ id: order.id, code: order.code });
  } catch (error) {
    return toActionError(error, {
      unique: { code: "Conflicto al generar el código. Inténtalo de nuevo." },
    });
  }
}

export async function updatePurchaseOrderAction(
  id: string,
  input: PurchaseOrderInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requirePermission("purchase-orders:manage");
    const values = purchaseOrderSchema.parse(input);

    await prisma.$transaction(async (tx) => {
      const before = await tx.purchaseOrder.findUnique({ where: { id }, include: { items: true } });
      if (!before) throw new NotFoundError();
      assertCanPerform(before.status, "edit");
      await assertReferences(tx, values);

      await tx.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: id } });
      const after = await tx.purchaseOrder.update({
        where: { id },
        data: { ...toOrderData(values), items: { create: values.items } },
        include: { items: true },
      });
      await recordAudit(tx, {
        userId: session.user.id,
        action: "UPDATE",
        entity: ENTITY,
        entityId: id,
        before,
        after,
      });
    });

    revalidateOrder(id);
    return ok({ id });
  } catch (error) {
    return toActionError(error);
  }
}

export async function sendPurchaseOrderAction(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requirePermission("purchase-orders:manage");

    await prisma.$transaction(async (tx) => {
      const order = await tx.purchaseOrder.findUnique({
        where: { id },
        include: { _count: { select: { items: true } } },
      });
      if (!order) throw new NotFoundError();
      assertCanPerform(order.status, "send");
      if (order._count.items === 0) {
        throw new BusinessRuleError("La orden no tiene productos.");
      }
      await tx.purchaseOrder.update({
        where: { id },
        data: { status: "SENT", sentAt: new Date() },
      });
      await recordAudit(tx, {
        userId: session.user.id,
        action: "STATUS_CHANGE",
        entity: ENTITY,
        entityId: id,
        before: { status: order.status },
        after: { status: "SENT" },
      });
    });

    revalidateOrder(id);
    return ok({ id });
  } catch (error) {
    return toActionError(error);
  }
}

export async function cancelPurchaseOrderAction(
  id: string,
  reason: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requirePermission("purchase-orders:manage");
    const trimmedReason = reason.trim().slice(0, 255);

    await prisma.$transaction(async (tx) => {
      const order = await tx.purchaseOrder.findUnique({ where: { id } });
      if (!order) throw new NotFoundError();
      assertCanPerform(order.status, "cancel");
      await tx.purchaseOrder.update({
        where: { id },
        data: { status: "CANCELLED", cancelledAt: new Date() },
      });
      await recordAudit(tx, {
        userId: session.user.id,
        action: "STATUS_CHANGE",
        entity: ENTITY,
        entityId: id,
        before: { status: order.status },
        after: { status: "CANCELLED", reason: trimmedReason || null },
      });
    });

    revalidateOrder(id);
    return ok({ id });
  } catch (error) {
    return toActionError(error);
  }
}

export interface ReceiveResult {
  id: string;
  status: string;
  totalReceived: number;
}

/**
 * Recibe la orden (total o parcialmente). Por cada ítem con cantidad > 0 genera un
 * movimiento IN con el costo del ítem y la referencia de la orden, dentro de la misma
 * transacción que actualiza los ítems y el estado.
 */
export async function receivePurchaseOrderAction(
  id: string,
  input: ReceiveItemsInput,
): Promise<ActionResult<ReceiveResult>> {
  try {
    const session = await requirePermission("purchase-orders:receive");
    const values = receiveItemsSchema.parse(input);

    const result = await withSerializableTransaction(async (tx) => {
      const order = await tx.purchaseOrder.findUnique({
        where: { id },
        include: { items: { include: { product: { select: { name: true } } } } },
      });
      if (!order) throw new NotFoundError();
      assertCanPerform(order.status, "receive");

      const plan = planReceipt(
        order.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          productName: item.product.name,
          quantityOrdered: item.quantityOrdered,
          quantityReceived: item.quantityReceived,
          unitCost: Number(item.unitCost),
        })),
        values.items,
      );

      for (const line of plan.lines) {
        await applyStockMovement(tx, {
          type: "IN",
          productId: line.productId,
          fromWarehouseId: null,
          toWarehouseId: order.warehouseId,
          quantity: line.quantity,
          unitCost: line.unitCost,
          reason: "Recepción de orden de compra",
          reference: order.code,
          userId: session.user.id,
        });
        await tx.purchaseOrderItem.update({
          where: { id: line.itemId },
          data: { quantityReceived: line.newQuantityReceived },
        });
      }

      await tx.purchaseOrder.update({
        where: { id },
        data: { status: plan.nextStatus, receivedAt: new Date() },
      });
      await recordAudit(tx, {
        userId: session.user.id,
        action: "STATUS_CHANGE",
        entity: ENTITY,
        entityId: id,
        before: { status: order.status },
        after: {
          status: plan.nextStatus,
          received: plan.lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
        },
      });

      return { id, status: plan.nextStatus, totalReceived: plan.totalReceived };
    });

    revalidateOrder(id);
    revalidatePath("/movements");
    revalidatePath("/products");
    return ok(result);
  } catch (error) {
    return toActionError(error);
  }
}
