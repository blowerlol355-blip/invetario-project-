import "server-only";

import { format } from "date-fns";

import type { ReportTable } from "@/features/reports/lib/report-table";
import {
  getInventoryValuation,
  getKardexReport,
  getMovementsForExport,
  MOVEMENT_EXPORT_LIMIT,
} from "@/features/reports/queries";
import {
  inventoryReportFiltersSchema,
  kardexFiltersSchema,
  normalizeRange,
} from "@/features/reports/schemas";
import { movementFiltersSchema } from "@/features/stock/schemas";
import { prisma } from "@/lib/db";
import { MOVEMENT_TYPE_LABELS } from "@/lib/domain";
import { formatDateTime, formatShortDate } from "@/lib/format";

export type ReportKey = "inventory" | "kardex" | "movements";

export const REPORT_KEYS: ReportKey[] = ["inventory", "kardex", "movements"];

type Params = Record<string, string | undefined>;

function money(value: number): number {
  return Math.round(value * 100) / 100;
}

function isoToLabel(iso: string): string {
  return formatShortDate(new Date(`${iso}T00:00:00`));
}

async function inventoryReport(params: Params): Promise<ReportTable> {
  const filters = inventoryReportFiltersSchema.parse(params);
  const [data, category, warehouse] = await Promise.all([
    getInventoryValuation(filters),
    filters.categoryId ? prisma.category.findUnique({ where: { id: filters.categoryId } }) : null,
    filters.warehouseId
      ? prisma.warehouse.findUnique({ where: { id: filters.warehouseId } })
      : null,
  ]);
  const scope = [
    warehouse ? `Almacén: ${warehouse.name}` : "Todos los almacenes",
    category ? `Categoría: ${category.name}` : "Todas las categorías",
    filters.q ? `Búsqueda: "${filters.q}"` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    title: "Inventario valorizado",
    subtitle: `${scope} · Costo promedio ponderado · ${formatDateTime(new Date())}`,
    filename: `inventario-valorizado-${format(new Date(), "yyyy-MM-dd")}`,
    columns: [
      { header: "SKU", width: "auto" },
      { header: "Producto", width: "*" },
      { header: "Categoría", width: "auto" },
      { header: "Unidad", width: "auto" },
      { header: "Existencia", align: "right", width: "auto" },
      { header: "Stock mín.", align: "right", width: "auto" },
      { header: "Costo prom. (USD)", align: "right", width: "auto" },
      { header: "Valor (USD)", align: "right", width: "auto" },
    ],
    rows: data.rows.map((row) => [
      row.sku,
      row.name,
      row.categoryName,
      row.unit,
      row.quantity,
      row.minStock,
      money(row.avgCost),
      money(row.value),
    ]),
    footer: [
      "Total",
      `${data.totals.products} productos`,
      "",
      "",
      data.totals.quantity,
      "",
      "",
      money(data.totals.value),
    ],
  };
}

async function kardexReport(params: Params): Promise<ReportTable> {
  const filters = kardexFiltersSchema.parse(params);
  const range = normalizeRange(filters.from, filters.to);
  const report = await getKardexReport({ ...filters, ...range });
  if (!report) {
    return {
      title: "Kardex",
      subtitle: "Selecciona un producto",
      filename: "kardex",
      columns: [{ header: "Sin datos" }],
      rows: [],
    };
  }
  const code = (id: string | null) => (id ? (report.warehouseCodes.get(id) ?? "") : "");
  return {
    title: `Kardex · ${report.product.name}`,
    subtitle: `${report.product.sku} · ${report.warehouse ? `Almacén ${report.warehouse.name}` : "Todos los almacenes"} · ${isoToLabel(range.from)} a ${isoToLabel(range.to)}`,
    filename: `kardex-${report.product.sku}-${range.from}-${range.to}`,
    columns: [
      { header: "Fecha", width: "auto" },
      { header: "Tipo", width: "auto" },
      { header: "Origen", width: "auto" },
      { header: "Destino", width: "auto" },
      { header: "Referencia", width: "auto" },
      { header: "Motivo", width: "*" },
      { header: "Usuario", width: "auto" },
      { header: "Costo unit.", align: "right", width: "auto" },
      { header: "Entrada", align: "right", width: "auto" },
      { header: "Salida", align: "right", width: "auto" },
      { header: "Saldo", align: "right", width: "auto" },
    ],
    rows: [
      ["", "Saldo inicial", "", "", "", "", "", "", "", "", report.kardex.openingBalance],
      ...report.kardex.lines.map((line) => [
        formatDateTime(line.createdAt),
        MOVEMENT_TYPE_LABELS[line.type],
        code(line.fromWarehouseId),
        code(line.toWarehouseId),
        line.reference ?? "",
        line.reason ?? "",
        line.userName,
        line.unitCost === null ? "" : money(line.unitCost),
        line.inbound || "",
        line.outbound || "",
        line.balance,
      ]),
    ],
    footer: [
      "Totales",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      report.kardex.totalInbound,
      report.kardex.totalOutbound,
      report.kardex.closingBalance,
    ],
  };
}

async function movementsReport(params: Params): Promise<ReportTable> {
  const filters = movementFiltersSchema.parse(params);
  const range = normalizeRange(filters.from, filters.to);
  const { rows, truncated } = await getMovementsForExport({ ...filters, ...range }, params.q ?? "");
  const inbound = rows.reduce(
    (sum, row) => sum + (row.toWarehouse && row.type !== "TRANSFER" ? row.quantity : 0),
    0,
  );
  const outbound = rows.reduce(
    (sum, row) => sum + (row.fromWarehouse && row.type !== "TRANSFER" ? row.quantity : 0),
    0,
  );

  return {
    title: "Movimientos de inventario",
    subtitle: `${isoToLabel(range.from)} a ${isoToLabel(range.to)}${filters.type ? ` · ${MOVEMENT_TYPE_LABELS[filters.type]}` : ""} · ${rows.length} movimientos`,
    filename: `movimientos-${range.from}-${range.to}`,
    columns: [
      { header: "Fecha", width: "auto" },
      { header: "Tipo", width: "auto" },
      { header: "SKU", width: "auto" },
      { header: "Producto", width: "*" },
      { header: "Origen", width: "auto" },
      { header: "Destino", width: "auto" },
      { header: "Cantidad", align: "right", width: "auto" },
      { header: "Costo unit.", align: "right", width: "auto" },
      { header: "Referencia", width: "auto" },
      { header: "Motivo", width: "*" },
      { header: "Usuario", width: "auto" },
    ],
    rows: rows.map((row) => [
      formatDateTime(row.createdAt),
      MOVEMENT_TYPE_LABELS[row.type],
      row.sku,
      row.productName,
      row.fromWarehouse ?? "",
      row.toWarehouse ?? "",
      row.quantity,
      row.unitCost === null ? "" : money(row.unitCost),
      row.reference ?? "",
      row.reason ?? "",
      row.userName,
    ]),
    footer: ["Totales", "", "", "", "Entradas", inbound, "Salidas", outbound, "", "", ""],
    notes: truncated
      ? [
          `La exportación se limita a ${MOVEMENT_EXPORT_LIMIT} movimientos. Acota el rango de fechas para ver el resto.`,
        ]
      : undefined,
  };
}

export const REPORTS: Record<ReportKey, (params: Params) => Promise<ReportTable>> = {
  inventory: inventoryReport,
  kardex: kardexReport,
  movements: movementsReport,
};
