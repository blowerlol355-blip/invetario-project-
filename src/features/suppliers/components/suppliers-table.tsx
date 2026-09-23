"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { StatusBadge } from "@/components/status-badge";
import { ColumnHeader } from "@/components/tables/column-header";
import { DataTable, type SortState } from "@/components/tables/data-table";
import { SupplierRowActions } from "@/features/suppliers/components/supplier-row-actions";
import type { SupplierRow } from "@/features/suppliers/queries";
import { formatInteger } from "@/lib/format";
import type { Paginated } from "@/lib/query-params";

const columns: ColumnDef<SupplierRow, unknown>[] = [
  {
    id: "name",
    accessorKey: "name",
    header: ({ column }) => <ColumnHeader column={column} title="Proveedor" />,
    cell: ({ row }) => (
      <div className="min-w-52">
        <p className="font-medium">{row.original.name}</p>
        {row.original.taxId && (
          <p className="font-mono text-xs text-muted-foreground">{row.original.taxId}</p>
        )}
      </div>
    ),
  },
  {
    id: "contactName",
    accessorKey: "contactName",
    header: ({ column }) => <ColumnHeader column={column} title="Contacto" />,
    cell: ({ row }) => (
      <div className="min-w-40">
        <p>{row.original.contactName ?? "-"}</p>
        {row.original.phone && (
          <p className="text-xs text-muted-foreground">{row.original.phone}</p>
        )}
      </div>
    ),
  },
  {
    id: "email",
    accessorKey: "email",
    header: ({ column }) => <ColumnHeader column={column} title="Correo" />,
    cell: ({ row }) =>
      row.original.email ? (
        <a href={`mailto:${row.original.email}`} className="text-primary hover:underline">
          {row.original.email}
        </a>
      ) : (
        <span className="text-muted-foreground">-</span>
      ),
  },
  {
    id: "productCount",
    accessorKey: "productCount",
    header: ({ column }) => (
      <ColumnHeader column={column} title="Productos" className="justify-end" />
    ),
    cell: ({ row }) => formatInteger(row.original.productCount),
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
    cell: ({ row }) => <SupplierRowActions supplier={row.original} />,
    meta: { className: "w-12 text-right" },
  },
];

interface SuppliersTableProps {
  data: Paginated<SupplierRow>;
  sortState: SortState;
}

export function SuppliersTable({ data, sortState }: SuppliersTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      sortState={sortState}
      searchPlaceholder="Buscar por nombre, contacto, correo o RUC"
      emptyTitle="Sin proveedores"
      emptyDescription="Registra a los proveedores que abastecen tu inventario."
    />
  );
}
