/** Decimales con los que se almacena el costo promedio (Decimal(12,4) en la BD). */
export const COST_DECIMALS = 4;

/** Redondea un valor monetario a los decimales indicados evitando errores de coma flotante. */
export function roundCost(value: number, decimals: number = COST_DECIMALS): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/**
 * Calcula el nuevo costo promedio ponderado tras una entrada de stock.
 *
 * Fórmula: (existencia × costo promedio actual + cantidad entrante × costo unitario)
 *          / (existencia + cantidad entrante)
 *
 * Si no hay existencia previa (o es negativa por inconsistencia), el promedio pasa
 * a ser el costo unitario de la entrada.
 *
 * @param currentQuantity Existencia total del producto antes de la entrada.
 * @param currentAverageCost Costo promedio vigente.
 * @param incomingQuantity Cantidad que entra (debe ser > 0).
 * @param incomingUnitCost Costo unitario de la entrada (debe ser >= 0).
 */
export function calculateWeightedAverageCost(
  currentQuantity: number,
  currentAverageCost: number,
  incomingQuantity: number,
  incomingUnitCost: number,
): number {
  if (!Number.isFinite(incomingQuantity) || incomingQuantity <= 0) {
    throw new RangeError("La cantidad entrante debe ser mayor que cero.");
  }
  if (!Number.isFinite(incomingUnitCost) || incomingUnitCost < 0) {
    throw new RangeError("El costo unitario no puede ser negativo.");
  }

  if (currentQuantity <= 0) {
    return roundCost(incomingUnitCost);
  }

  const totalValue = currentQuantity * currentAverageCost + incomingQuantity * incomingUnitCost;
  return roundCost(totalValue / (currentQuantity + incomingQuantity));
}
