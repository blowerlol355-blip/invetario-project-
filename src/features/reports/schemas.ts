import { format, subDays } from "date-fns";
import { z } from "zod";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .catch("");

export const inventoryReportFiltersSchema = z.object({
  categoryId: z.uuid().catch(""),
  warehouseId: z.uuid().catch(""),
  q: z.string().trim().max(100).catch(""),
});

export type InventoryReportFilters = z.infer<typeof inventoryReportFiltersSchema>;

export const kardexFiltersSchema = z.object({
  productId: z.uuid().catch(""),
  warehouseId: z.uuid().catch(""),
  from: isoDate,
  to: isoDate,
});

export type KardexFilters = z.infer<typeof kardexFiltersSchema>;

/** Rango por defecto del kardex y del reporte de movimientos: últimos 30 días. */
export function defaultDateRange(now: Date = new Date()): { from: string; to: string } {
  return { from: format(subDays(now, 29), "yyyy-MM-dd"), to: format(now, "yyyy-MM-dd") };
}

/** Normaliza un rango: aplica defaults y garantiza from <= to. */
export function normalizeRange(from: string, to: string, now: Date = new Date()) {
  const defaults = defaultDateRange(now);
  const range = { from: from || defaults.from, to: to || defaults.to };
  if (range.from > range.to) [range.from, range.to] = [range.to, range.from];
  return range;
}
