"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

import { MovementTypeBadge } from "@/components/movement-type-badge";
import { ColumnHeader } from "@/components/tables/column-header";
import { DataTable, type SortState } from "@/components/tables/data-table";
import { MovementFilters } from "@/features/stock/components/movement-filters";
import type { MovementRow, UserOption } from "@/features/stock/queries";
import type { WarehouseOption } from "@/features/warehouses/queries";
import { formatCurrency, formatDateTime, formatInteger } from "@/lib/format";
import type { Paginated } from "@/lib/query-params";
import { cn } from "@/lib/utils";

const columns: ColumnDef<MovementRow, unknown>[] = [
  {
    id: "createdAt",
    accessorKey: "createdAt",
    header: ({ column }) => <ColumnHeader column={column} title="Fecha" />,
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
    id: "product",
    header: "Producto",
    enableSorting: false,
    cell: ({ row }) => (
      <div className="min-w-48">
        <Link href={`/products/${row.original.productId}`} className="font-medium hover:underline">
          {row.original.productName}
        </Link>
        <p className="font-mono text-xs text-muted-foreground">{row.original.sku}</p>
      </div>
    ),
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
    meta: { className: "font-mono text-xs whitespace-nowrap" },
  },
  {
    id: "quantity",
    header: "Cantidad",
    enableSorting: false,
    cell: ({ row }) => {
      const decreases =
        row.original.type === "OUT" ||
        (row.original.type === "ADJUSTMENT" && row.original.fromWarehouse);
      const neutral = row.original.type === "TRANSFER";
      return (
        <span
          className={cn(
            "font-medium",
            neutral ? "" : decreases ? "text-destructive" : "text-success",
          )}
        >
          {neutral ? "" : decreases ? "-" : "+"}
          {formatInteger(row.original.quantity)}{" "}
          <span className="text-xs font-normal text-muted-foreground">{row.original.unit}</span>
        </span>
      );
    },
    meta: { className: "text-right tabular-nums whitespace-nowrap" },
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
        <p className="line-clamp-1">{row.original.reason ?? "-"}</p>
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

interface MovementsTableProps {
  data: Paginated<MovementRow>;
  sortState: SortState;
  warehouses: WarehouseOption[];
  users: UserOption[];
  /** Rango mostrado cuando la URL no trae fechas (reporte por fecha). */
  defaultRange?: { from: string; to: string };
}

export function MovementsTable({
  data,
  sortState,
  warehouses,
  users,
  defaultRange,
}: MovementsTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      sortState={sortState}
      searchPlaceholder="Buscar por producto, SKU, referencia o motivo"
      showStatusFilter={false}
      filters={
        <MovementFilters warehouses={warehouses} users={users} defaultRange={defaultRange} />
      }
      emptyTitle="Sin movimientos"
      emptyDescription="No hay movimientos que coincidan con los filtros seleccionados."
    />
  );
}
