import type { StockMovementCommand } from "@/features/stock/lib/apply-movement";
import type { MovementInput } from "@/features/stock/schemas";

/** Traduce el formulario a la convención de la base (from resta, to suma). */
export function toMovementCommand(values: MovementInput, userId: string): StockMovementCommand {
  let fromWarehouseId: string | null = null;
  let toWarehouseId: string | null = null;

  switch (values.type) {
    case "IN":
      toWarehouseId = values.toWarehouseId;
      break;
    case "OUT":
      fromWarehouseId = values.fromWarehouseId;
      break;
    case "TRANSFER":
      fromWarehouseId = values.fromWarehouseId;
      toWarehouseId = values.toWarehouseId;
      break;
    case "ADJUSTMENT":
      if (values.adjustmentDirection === "increase") toWarehouseId = values.warehouseId;
      else fromWarehouseId = values.warehouseId;
      break;
  }

  return {
    type: values.type,
    productId: values.productId,
    fromWarehouseId,
    toWarehouseId,
    quantity: values.quantity,
    unitCost: values.type === "IN" ? values.unitCost : null,
    reason: values.reason || null,
    reference: values.reference ? values.reference.toUpperCase() : null,
    userId,
  };
}
