import { format as formatDate, formatDistanceToNowStrict, isValid } from "date-fns";
import { es } from "date-fns/locale";

/**
 * Formateadores centralizados. Formato regional acordado para el proyecto:
 * fechas dd/MM/yyyy (sudamericano) y moneda en dólares estadounidenses.
 */

export const DATE_FORMAT = "dd/MM/yyyy";
export const DATE_TIME_FORMAT = "dd/MM/yyyy HH:mm";
export const CURRENCY = "USD";
const NUMBER_LOCALE = "es-419";

const currencyFormatter = new Intl.NumberFormat(NUMBER_LOCALE, {
  style: "currency",
  currency: CURRENCY,
  currencyDisplay: "narrowSymbol",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const integerFormatter = new Intl.NumberFormat(NUMBER_LOCALE, { maximumFractionDigits: 0 });

const decimalFormatter = new Intl.NumberFormat(NUMBER_LOCALE, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
});

function toDate(value: Date | string | number): Date {
  return value instanceof Date ? value : new Date(value);
}

/** 15/03/2026 */
export function formatShortDate(value: Date | string | number): string {
  const date = toDate(value);
  return isValid(date) ? formatDate(date, DATE_FORMAT) : "";
}

/** 15/03/2026 14:05 */
export function formatDateTime(value: Date | string | number): string {
  const date = toDate(value);
  return isValid(date) ? formatDate(date, DATE_TIME_FORMAT) : "";
}

/** "hace 3 días" */
export function formatRelative(value: Date | string | number): string {
  const date = toDate(value);
  return isValid(date) ? formatDistanceToNowStrict(date, { addSuffix: true, locale: es }) : "";
}

/** $1,234.50 */
export function formatCurrency(value: number | string | { toString(): string }): string {
  const amount = typeof value === "number" ? value : Number(value.toString());
  return currencyFormatter.format(Number.isFinite(amount) ? amount : 0);
}

/** 1,234 */
export function formatInteger(value: number): string {
  return integerFormatter.format(value);
}

/** 1,234.5678 */
export function formatDecimal(value: number | string | { toString(): string }): string {
  const amount = typeof value === "number" ? value : Number(value.toString());
  return decimalFormatter.format(Number.isFinite(amount) ? amount : 0);
}

/** Iniciales para avatares: "Ana Torres" -> "AT". */
export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}
