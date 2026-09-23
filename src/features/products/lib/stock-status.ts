export type StockStatus = "out" | "low" | "ok" | "over";

export const STOCK_STATUS_LABELS: Record<StockStatus, string> = {
  out: "Sin stock",
  low: "Stock bajo",
  ok: "Normal",
  over: "Sobre máximo",
};

/**
 * Clasifica la existencia total de un producto.
 * Regla de negocio: hay alerta de stock bajo cuando quantity <= minStock.
 */
export function getStockStatus(
  quantity: number,
  minStock: number,
  maxStock: number | null,
): StockStatus {
  if (quantity <= 0) return "out";
  if (quantity <= minStock) return "low";
  if (maxStock !== null && quantity > maxStock) return "over";
  return "ok";
}

/** Margen bruto porcentual sobre el precio de venta. null si no se puede calcular. */
export function getMarginPercent(salePrice: number, cost: number): number | null {
  if (salePrice <= 0) return null;
  return Math.round(((salePrice - cost) / salePrice) * 1000) / 10;
}

/** Porcentaje de llenado respecto al máximo (o al doble del mínimo si no hay máximo). */
export function getStockFillPercent(
  quantity: number,
  minStock: number,
  maxStock: number | null,
): number {
  const reference = maxStock ?? Math.max(minStock * 2, 1);
  return Math.max(0, Math.min(100, Math.round((quantity / reference) * 100)));
}
