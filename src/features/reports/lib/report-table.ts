/** Representación neutra de un reporte tabular; CSV y PDF se generan desde aquí. */
export interface ReportColumn {
  header: string;
  align?: "left" | "right";
  /** Ancho relativo para el PDF ("*" = flexible, "auto" = al contenido). */
  width?: string | number;
}

export type ReportCell = string | number | null;

export interface ReportTable {
  title: string;
  subtitle: string;
  /** Nombre base del archivo (sin extensión). */
  filename: string;
  columns: ReportColumn[];
  rows: ReportCell[][];
  /** Fila de totales opcional (misma longitud que columns). */
  footer?: ReportCell[];
  /** Notas al pie (p. ej. "exportación limitada a 5000 filas"). */
  notes?: string[];
}
