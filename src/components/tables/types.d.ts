import "@tanstack/react-table";

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    /** Clases aplicadas a la celda y a la cabecera (alineación, ancho). */
    className?: string;
  }
}
