"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { StatusBadge } from "@/components/status-badge";
import { ColumnHeader } from "@/components/tables/column-header";
import { DataTable, type SortState } from "@/components/tables/data-table";
import { Badge } from "@/components/ui/badge";
import { WarehouseRowActions } from "@/features/warehouses/components/warehouse-row-actions";
import type { WarehouseRow } from "@/features/warehouses/queries";
import { formatInteger } from "@/lib/format";
import type { Paginated } from "@/lib/query-params";

const columns: ColumnDef<WarehouseRow, unknown>[] = [
  {
    id: "code",
    accessorKey: "code",
    header: ({ column }) => <ColumnHeader column={column} title="Código" />,
    cell: ({ row }) => (
      <Badge variant="outline" className="font-mono">
        {row.original.code}
      </Badge>
    ),
    meta: { className: "w-24" },
  },
  {
    id: "name",
    accessorKey: "name",
    header: ({ column }) => <ColumnHeader column={column} title="Nombre" />,
    cell: ({ row }) => (
      <div className="min-w-48">
        <p className="font-medium">{row.original.name}</p>
        {row.original.address && (
          <p className="line-clamp-1 text-xs text-muted-foreground">{row.original.address}</p>
        )}
      </div>
    ),
  },
  {
    id: "productCount",
    header: "Productos",
    enableSorting: false,
    cell: ({ row }) => formatInteger(row.original.productCount),
    meta: { className: "text-right tabular-nums" },
  },
  {
    id: "stockUnits",
    header: "Unidades",
    enableSorting: false,
    cell: ({ row }) => formatInteger(row.original.stockUnits),
    meta: { className: "text-right tabular-nums" },
  },
  {
    id: "isActive",
    accessorKey: "isActive",
    header: "Estado",
    enableSorting: false,
    cell: ({ row }) => <StatusBadge active={row.original.isActive} />,
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Acciones</span>,
    enableSorting: false,
    cell: ({ row }) => <WarehouseRowActions warehouse={row.original} />,
    meta: { className: "w-12 text-right" },
  },
];

interface WarehousesTableProps {
  data: Paginated<WarehouseRow>;
  sortState: SortState;
}

export function WarehousesTable({ data, sortState }: WarehousesTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      sortState={sortState}
      searchPlaceholder="Buscar por código, nombre o dirección"
      emptyTitle="Sin almacenes"
      emptyDescription="Crea al menos un almacén para poder registrar existencias."
    />
  );
}
