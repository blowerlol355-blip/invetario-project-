"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { StatusBadge } from "@/components/status-badge";
import { ColumnHeader } from "@/components/tables/column-header";
import { DataTable, type SortState } from "@/components/tables/data-table";
import { CategoryRowActions } from "@/features/categories/components/category-row-actions";
import type { CategoryRow } from "@/features/categories/queries";
import { formatInteger, formatShortDate } from "@/lib/format";
import type { Paginated } from "@/lib/query-params";

const columns: ColumnDef<CategoryRow, unknown>[] = [
  {
    id: "name",
    accessorKey: "name",
    header: ({ column }) => <ColumnHeader column={column} title="Nombre" />,
    cell: ({ row }) => (
      <div className="min-w-48">
        <p className="font-medium">{row.original.name}</p>
        {row.original.description && (
          <p className="line-clamp-1 text-xs text-muted-foreground">{row.original.description}</p>
        )}
      </div>
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
    id: "createdAt",
    accessorKey: "createdAt",
    header: ({ column }) => <ColumnHeader column={column} title="Creada" />,
    cell: ({ row }) => formatShortDate(row.original.createdAt),
    meta: { className: "whitespace-nowrap" },
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Acciones</span>,
    enableSorting: false,
    cell: ({ row }) => <CategoryRowActions category={row.original} />,
    meta: { className: "w-12 text-right" },
  },
];

interface CategoriesTableProps {
  data: Paginated<CategoryRow>;
  sortState: SortState;
}

export function CategoriesTable({ data, sortState }: CategoriesTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      sortState={sortState}
      searchPlaceholder="Buscar por nombre o descripción"
      emptyTitle="Sin categorías"
      emptyDescription="Crea la primera categoría para empezar a organizar tus productos."
    />
  );
}
