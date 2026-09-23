"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { KeyRoundIcon } from "lucide-react";

import { StatusBadge } from "@/components/status-badge";
import { ColumnHeader } from "@/components/tables/column-header";
import { DataTable, type SortState } from "@/components/tables/data-table";
import { Badge } from "@/components/ui/badge";
import { RoleBadge } from "@/features/users/components/role-badge";
import { UserFilters } from "@/features/users/components/user-filters";
import { UserRowActions } from "@/features/users/components/user-row-actions";
import type { UserRow } from "@/features/users/queries";
import { formatInteger, formatShortDate, getInitials } from "@/lib/format";
import type { Paginated } from "@/lib/query-params";

function buildColumns(currentUserId: string): ColumnDef<UserRow, unknown>[] {
  return [
    {
      id: "name",
      accessorKey: "name",
      header: ({ column }) => <ColumnHeader column={column} title="Usuario" />,
      cell: ({ row }) => (
        <div className="flex min-w-56 items-center gap-3">
          <span
            aria-hidden
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
          >
            {getInitials(row.original.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium">
              {row.original.name}
              {row.original.id === currentUserId && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">(tú)</span>
              )}
            </p>
            <p className="truncate text-xs text-muted-foreground">{row.original.email}</p>
          </div>
        </div>
      ),
    },
    {
      id: "role",
      accessorKey: "role",
      header: ({ column }) => <ColumnHeader column={column} title="Rol" />,
      cell: ({ row }) => <RoleBadge role={row.original.role} />,
    },
    {
      id: "isActive",
      accessorKey: "isActive",
      header: "Estado",
      enableSorting: false,
      cell: ({ row }) => <StatusBadge active={row.original.isActive} />,
    },
    {
      id: "apiKey",
      header: "Clave de API",
      enableSorting: false,
      cell: ({ row }) =>
        row.original.hasApiKey ? (
          <Badge variant="outline" className="gap-1 font-normal">
            <KeyRoundIcon className="size-3" />
            {row.original.apiKeyCreatedAt
              ? formatShortDate(row.original.apiKeyCreatedAt)
              : "Activa"}
          </Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
      meta: { className: "whitespace-nowrap" },
    },
    {
      id: "movementCount",
      accessorKey: "movementCount",
      header: () => <span className="block text-right font-medium">Movimientos</span>,
      enableSorting: false,
      cell: ({ row }) => formatInteger(row.original.movementCount),
      meta: { className: "text-right tabular-nums" },
    },
    {
      id: "createdAt",
      accessorKey: "createdAt",
      header: ({ column }) => <ColumnHeader column={column} title="Alta" />,
      cell: ({ row }) => formatShortDate(row.original.createdAt),
      meta: { className: "whitespace-nowrap" },
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Acciones</span>,
      enableSorting: false,
      cell: ({ row }) => <UserRowActions user={row.original} currentUserId={currentUserId} />,
      meta: { className: "w-12 text-right" },
    },
  ];
}

interface UsersTableProps {
  data: Paginated<UserRow>;
  sortState: SortState;
  currentUserId: string;
}

export function UsersTable({ data, sortState, currentUserId }: UsersTableProps) {
  return (
    <DataTable
      columns={buildColumns(currentUserId)}
      data={data}
      sortState={sortState}
      searchPlaceholder="Buscar por nombre o correo"
      filters={<UserFilters />}
      emptyTitle="Sin usuarios"
      emptyDescription="No hay usuarios que coincidan con la búsqueda o los filtros."
    />
  );
}
