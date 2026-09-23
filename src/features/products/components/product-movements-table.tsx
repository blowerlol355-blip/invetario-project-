"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { MovementTypeBadge } from "@/components/movement-type-badge";
import { DataTable } from "@/components/tables/data-table";
import type { ProductMovementRow } from "@/features/products/queries";
import { formatCurrency, formatDateTime, formatInteger } from "@/lib/format";
import type { Paginated } from "@/lib/query-params";

const columns: ColumnDef<ProductMovementRow, unknown>[] = [
  {
    id: "createdAt",
    header: "Fecha",
    enableSorting: false,
    cell: ({ row }) => formatDateTime(row.original.createdAt),
    meta: { className: "whitespace-nowrap" },
  },
  {
    id: "type",
    header: "Tipo",
    enableSorting: false,
    cell: ({ row }) => <MovementTypeBadge type={row.original.type} />,
  },
  {
    id: "warehouses",
    header: "Almacén",
    enableSorting: false,
    cell: ({ row }) => {
      const { fromWarehouse, toWarehouse } = row.original;
      if (fromWarehouse && toWarehouse) return `${fromWarehouse} → ${toWarehouse}`;
      return fromWarehouse ?? toWarehouse ?? "-";
    },
    meta: { className: "font-mono text-xs" },
  },
  {
    id: "quantity",
    header: "Cantidad",
    enableSorting: false,
    cell: ({ row }) => {
      const decreases =
        row.original.type === "OUT" ||
        (row.original.type === "ADJUSTMENT" && row.original.fromWarehouse);
      return (
        <span className={decreases ? "text-destructive" : "text-success"}>
          {decreases ? "-" : "+"}
          {formatInteger(row.original.quantity)}
        </span>
      );
    },
    meta: { className: "text-right tabular-nums" },
  },
  {
    id: "unitCost",
    header: "Costo unit.",
    enableSorting: false,
    cell: ({ row }) =>
      row.original.unitCost === null ? "-" : formatCurrency(row.original.unitCost),
    meta: { className: "text-right tabular-nums" },
  },
  {
    id: "reason",
    header: "Motivo / referencia",
    enableSorting: false,
    cell: ({ row }) => (
      <div className="min-w-40">
        <p>{row.original.reason ?? "-"}</p>
        {row.original.reference && (
          <p className="font-mono text-xs text-muted-foreground">{row.original.reference}</p>
        )}
      </div>
    ),
  },
  {
    id: "user",
    header: "Usuario",
    enableSorting: false,
    cell: ({ row }) => row.original.userName,
    meta: { className: "whitespace-nowrap" },
  },
];

export function ProductMovementsTable({ data }: { data: Paginated<ProductMovementRow> }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      sortState={{ sort: "", order: "desc" }}
      showStatusFilter={false}
      showSearch={false}
      emptyTitle="Sin movimientos"
      emptyDescription="Este producto todavía no tiene entradas, salidas ni transferencias."
    />
  );
}
