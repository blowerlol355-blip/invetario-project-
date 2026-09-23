import { calculateWeightedAverageCost } from "@/features/stock/lib/average-cost";
import type { Prisma } from "@/generated/prisma/client";
import type { MovementType } from "@/lib/domain";
import { BusinessRuleError, NotFoundError } from "@/lib/errors";

/**
 * Orden de movimiento ya normalizada a la convención de la base de datos:
 * quantity > 0 y el sentido lo dan los almacenes (from resta, to suma).
 */
export interface StockMovementCommand {
  type: MovementType;
  productId: string;
  fromWarehouseId: string | null;
  toWarehouseId: string | null;
  quantity: number;
  unitCost: number | null;
  reason: string | null;
  reference: string | null;
  userId: string;
}

export interface StockMovementResult {
  movementId: string;
  productId: string;
  /** Nuevo costo promedio si el movimiento fue una entrada; null en otro caso. */
  newAverageCost: number | null;
  /** Existencias resultantes en los almacenes afectados. */
  balances: { warehouseId: string; quantity: number }[];
}

/**
 * Valida la estructura de la orden sin tocar la base de datos.
 * Es la misma regla que impone el CHECK `stock_movements_warehouses_check`.
 */
export function validateMovementCommand(command: StockMovementCommand): void {
  const { type, fromWarehouseId, toWarehouseId, quantity, unitCost } = command;

  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new BusinessRuleError("La cantidad debe ser un número entero mayor que cero.");
  }

  switch (type) {
    case "IN":
      if (!toWarehouseId || fromWarehouseId) {
        throw new BusinessRuleError("Una entrada requiere solo un almacén de destino.");
      }
      if (unitCost === null || unitCost < 0) {
        throw new BusinessRuleError("Una entrada requiere un costo unitario mayor o igual a cero.");
      }
      break;
    case "OUT":
      if (!fromWarehouseId || toWarehouseId) {
        throw new BusinessRuleError("Una salida requiere solo un almacén de origen.");
      }
      break;
    case "TRANSFER":
      if (!fromWarehouseId || !toWarehouseId) {
        throw new BusinessRuleError("Una transferencia requiere almacén de origen y de destino.");
      }
      if (fromWarehouseId === toWarehouseId) {
        throw new BusinessRuleError("El almacén de destino debe ser distinto del de origen.");
      }
      break;
    case "ADJUSTMENT":
      if (Boolean(fromWarehouseId) === Boolean(toWarehouseId)) {
        throw new BusinessRuleError("Un ajuste afecta exactamente a un almacén.");
      }
      break;
  }
}

/**
 * Aplica un movimiento de stock dentro de una transacción ya abierta.
 *
 * Es la ÚNICA función que modifica la tabla `stocks`. Garantiza:
 * - Sin stock negativo: la resta usa una actualización condicional
 *   (`quantity >= cantidad`), atómica incluso con peticiones concurrentes.
 * - Transferencias atómicas: origen y destino se actualizan en la misma transacción.
 * - Costo promedio ponderado: cada entrada con costo recalcula `Product.avgCost`.
 *
 * Lanza BusinessRuleError con mensajes aptos para el usuario.
 */
export async function applyStockMovement(
  tx: Prisma.TransactionClient,
  command: StockMovementCommand,
): Promise<StockMovementResult> {
  validateMovementCommand(command);

  const product = await tx.product.findUnique({
    where: { id: command.productId },
    include: { stocks: { select: { warehouseId: true, quantity: true } } },
  });
  if (!product) throw new NotFoundError("El producto no existe.");
  if (!product.isActive) {
    throw new BusinessRuleError(`El producto "${product.name}" está inactivo.`);
  }

  const warehouseIds = [command.fromWarehouseId, command.toWarehouseId].filter((id): id is string =>
    Boolean(id),
  );
  const warehouses = await tx.warehouse.findMany({ where: { id: { in: warehouseIds } } });
  for (const id of warehouseIds) {
    const warehouse = warehouses.find((w) => w.id === id);
    if (!warehouse) throw new NotFoundError("El almacén seleccionado no existe.");
    if (!warehouse.isActive) {
      throw new BusinessRuleError(`El almacén "${warehouse.name}" está inactivo.`);
    }
  }

  const balances: { warehouseId: string; quantity: number }[] = [];
  const totalBefore = product.stocks.reduce((sum, stock) => sum + stock.quantity, 0);

  if (command.fromWarehouseId) {
    const from = command.fromWarehouseId;
    const current = product.stocks.find((s) => s.warehouseId === from)?.quantity ?? 0;
    const warehouseName = warehouses.find((w) => w.id === from)?.name ?? from;
    if (current < command.quantity) {
      throw new BusinessRuleError(
        `Stock insuficiente en ${warehouseName}: hay ${current} ${product.unit} y se intenta retirar ${command.quantity}.`,
      );
    }
    // Actualización condicional: si otra transacción consumió el stock entre la lectura
    // y esta escritura, count será 0 y el movimiento se rechaza en lugar de dejar negativo.
    const updated = await tx.stock.updateMany({
      where: { productId: product.id, warehouseId: from, quantity: { gte: command.quantity } },
      data: { quantity: { decrement: command.quantity } },
    });
    if (updated.count === 0) {
      throw new BusinessRuleError(
        `El stock de ${warehouseName} cambió mientras se registraba el movimiento. Vuelve a intentarlo.`,
      );
    }
    balances.push({ warehouseId: from, quantity: current - command.quantity });
  }

  if (command.toWarehouseId) {
    const to = command.toWarehouseId;
    const current = product.stocks.find((s) => s.warehouseId === to)?.quantity ?? 0;
    await tx.stock.upsert({
      where: { productId_warehouseId: { productId: product.id, warehouseId: to } },
      create: { productId: product.id, warehouseId: to, quantity: command.quantity },
      update: { quantity: { increment: command.quantity } },
    });
    balances.push({ warehouseId: to, quantity: current + command.quantity });
  }

  let newAverageCost: number | null = null;
  if (command.type === "IN" && command.unitCost !== null) {
    newAverageCost = calculateWeightedAverageCost(
      totalBefore,
      Number(product.avgCost),
      command.quantity,
      command.unitCost,
    );
    await tx.product.update({ where: { id: product.id }, data: { avgCost: newAverageCost } });
  }

  const movement = await tx.stockMovement.create({
    data: {
      type: command.type,
      productId: product.id,
      fromWarehouseId: command.fromWarehouseId,
      toWarehouseId: command.toWarehouseId,
      quantity: command.quantity,
      unitCost: command.type === "IN" ? command.unitCost : null,
      reason: command.reason,
      reference: command.reference,
      userId: command.userId,
    },
  });

  return { movementId: movement.id, productId: product.id, newAverageCost, balances };
}
