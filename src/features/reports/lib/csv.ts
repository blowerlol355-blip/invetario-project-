export interface CsvColumn<T> {
  header: string;
  value: (row: T) => string | number | null | undefined;
}

/** Escapa un valor CSV: comillas dobles alrededor si contiene separador, comillas o saltos. */
export function escapeCsvValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const text = typeof value === "number" ? String(value) : value;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * Genera un CSV (separador coma, fin de línea CRLF) con BOM UTF-8 para que Excel
 * reconozca los acentos. Los números se escriben con punto decimal.
 */
export function toCsv<T>(columns: CsvColumn<T>[], rows: T[]): string {
  const header = columns.map((column) => escapeCsvValue(column.header)).join(",");
  const lines = rows.map((row) =>
    columns.map((column) => escapeCsvValue(column.value(row))).join(","),
  );
  return `﻿${[header, ...lines].join("\r\n")}\r\n`;
}
