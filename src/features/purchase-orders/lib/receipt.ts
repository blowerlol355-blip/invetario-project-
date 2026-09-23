import type { PurchaseOrderStatus } from "@/lib/domain";
import { BusinessRuleError } from "@/lib/errors";

export interface ReceiptOrderItem {
  id: string;
  productId: string;
  productName: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitCost: number;
}

export interface ReceiptInputItem {
  itemId: string;
  quantity: number;
}

export interface ReceiptPlanLine {
  itemId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  newQuantityReceived: number;
}

export interface ReceiptPlan {
  lines: ReceiptPlanLine[];
  nextStatus: Extract<PurchaseOrderStatus, "RECEIVED" | "PARTIALLY_RECEIVED">;
  totalReceived: number;
}

/**
 * Valida las cantidades a recibir contra lo pendiente de cada ítem y calcula el
 * estado resultante. No toca la base de datos: la acción de recepción aplica el
 * plan dentro de una transacción generando un movimiento IN por línea.
 */
export function planReceipt(items: ReceiptOrderItem[], input: ReceiptInputItem[]): ReceiptPlan {
  const lines: ReceiptPlanLine[] = [];

  for (const entry of input) {
    const item = items.find((i) => i.id === entry.itemId);
    if (!item) throw new BusinessRuleError("Uno de los ítems no pertenece a esta orden.");
    if (!Number.isInteger(entry.quantity) || entry.quantity < 0) {
      throw new BusinessRuleError(`Cantidad inválida para ${item.productName}.`);
    }
    if (entry.quantity === 0) continue;

    const pending = item.quantityOrdered - item.quantityReceived;
    if (entry.quantity > pending) {
      throw new BusinessRuleError(
        `${item.productName}: se intenta recibir ${entry.quantity} pero solo quedan ${pending} pendientes.`,
      );
    }
    lines.push({
      itemId: item.id,
      productId: item.productId,
      productName: item.productName,
      quantity: entry.quantity,
      unitCost: item.unitCost,
      newQuantityReceived: item.quantityReceived + entry.quantity,
    });
  }

  if (lines.length === 0) {
    throw new BusinessRuleError("Indica al menos una cantidad mayor que cero para recibir.");
  }

  const complete = items.every((item) => {
    const line = lines.find((l) => l.itemId === item.id);
    const received = line ? line.newQuantityReceived : item.quantityReceived;
    return received >= item.quantityOrdered;
  });

  return {
    lines,
    nextStatus: complete ? "RECEIVED" : "PARTIALLY_RECEIVED",
    totalReceived: lines.reduce((sum, line) => sum + line.quantity, 0),
  };
}
