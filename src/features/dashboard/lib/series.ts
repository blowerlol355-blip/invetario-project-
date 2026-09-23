import { addDays, format, subDays } from "date-fns";

export interface DailyMovementRow {
  /** Día en formato yyyy-MM-dd. */
  day: string;
  inbound: number;
  outbound: number;
  movements: number;
}

export interface DailyMovementPoint extends DailyMovementRow {
  /** Etiqueta corta para el eje (dd/MM). */
  label: string;
}

/**
 * Completa la serie diaria con ceros en los días sin movimientos, de modo que la
 * gráfica siempre muestre exactamente `days` puntos consecutivos hasta `today`.
 */
export function fillDailySeries(
  rows: DailyMovementRow[],
  days: number,
  today: Date = new Date(),
): DailyMovementPoint[] {
  const byDay = new Map(rows.map((row) => [row.day, row]));
  const start = subDays(today, days - 1);
  const points: DailyMovementPoint[] = [];
  for (let i = 0; i < days; i++) {
    const date = addDays(start, i);
    const day = format(date, "yyyy-MM-dd");
    const row = byDay.get(day);
    points.push({
      day,
      label: format(date, "dd/MM"),
      inbound: row?.inbound ?? 0,
      outbound: row?.outbound ?? 0,
      movements: row?.movements ?? 0,
    });
  }
  return points;
}
