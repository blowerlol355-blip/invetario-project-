import type { MovementType } from "@/lib/domain";

export interface KardexMovement {
  id: string;
  type: MovementType;
  fromWarehouseId: string | null;
  toWarehouseId: string | null;
  quantity: number;
  unitCost: number | null;
  reason: string | null;
  reference: string | null;
  userName: string;
  createdAt: Date;
}

export interface KardexLine extends KardexMovement {
  inbound: number;
  outbound: number;
  balance: number;
}

export interface Kardex {
  openingBalance: number;
  lines: KardexLine[];
  totalInbound: number;
  totalOutbound: number;
  closingBalance: number;
}

/**
 * Efecto de un movimiento sobre el saldo del ámbito consultado (todos los almacenes
 * o uno concreto). Una transferencia dentro del mismo ámbito global no cambia el
 * saldo; vista desde un almacén, es entrada o salida según el lado.
 */
export function movementEffect(
  movement: Pick<KardexMovement, "fromWarehouseId" | "toWarehouseId" | "quantity">,
  warehouseId: string | null,
): { inbound: number; outbound: number } {
  const affectsFrom =
    movement.fromWarehouseId !== null &&
    (warehouseId === null || movement.fromWarehouseId === warehouseId);
  const affectsTo =
    movement.toWarehouseId !== null &&
    (warehouseId === null || movement.toWarehouseId === warehouseId);
  return {
    inbound: affectsTo ? movement.quantity : 0,
    outbound: affectsFrom ? movement.quantity : 0,
  };
}

/** Construye el kardex con saldo corrido a partir del saldo inicial y los movimientos ordenados. */
export function buildKardex(
  openingBalance: number,
  movements: KardexMovement[],
  warehouseId: string | null = null,
): Kardex {
  let balance = openingBalance;
  let totalInbound = 0;
  let totalOutbound = 0;
  const lines: KardexLine[] = [];

  for (const movement of movements) {
    const { inbound, outbound } = movementEffect(movement, warehouseId);
    balance += inbound - outbound;
    totalInbound += inbound;
    totalOutbound += outbound;
    lines.push({ ...movement, inbound, outbound, balance });
  }

  return { openingBalance, lines, totalInbound, totalOutbound, closingBalance: balance };
}
