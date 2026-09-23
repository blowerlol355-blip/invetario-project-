"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { EyeIcon } from "lucide-react";
import { useState } from "react";

import { ColumnHeader } from "@/components/tables/column-header";
import { DataTable, type SortState } from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
import { AuditActionBadge } from "@/features/audit/components/audit-action-badge";
import { AuditDetailDialog } from "@/features/audit/components/audit-detail-dialog";
import { AuditFilters } from "@/features/audit/components/audit-filters";
import type { AuditRow } from "@/features/audit/queries";
import type { UserOption } from "@/features/stock/queries";
import { AUDIT_ENTITY_LABELS, type AuditEntity } from "@/lib/domain";
import { formatDateTime } from "@/lib/format";
import type { Paginated } from "@/lib/query-params";

function DetailButton({ log }: { log: AuditRow }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="ghost" size="icon-sm" aria-label="Ver detalle" onClick={() => setOpen(true)}>
        <EyeIcon className="size-4" />
      </Button>
      <AuditDetailDialog open={open} onOpenChange={setOpen} log={log} />
    </>
  );
}

const columns: ColumnDef<AuditRow, unknown>[] = [
  {
    id: "createdAt",
    accessorKey: "createdAt",
    header: ({ column }) => <ColumnHeader column={column} title="Fecha" />,
    cell: ({ row }) => formatDateTime(row.original.createdAt),
    meta: { className: "whitespace-nowrap tabular-nums" },
  },
  {
    id: "user",
    header: "Usuario",
    enableSorting: false,
    cell: ({ row }) =>
      row.original.userName ?? <span className="text-muted-foreground">Sistema</span>,
    meta: { className: "whitespace-nowrap" },
  },
  {
    id: "action",
    header: "Acción",
    enableSorting: false,
    cell: ({ row }) => <AuditActionBadge action={row.original.action} />,
  },
  {
    id: "entity",
    header: "Entidad",
    enableSorting: false,
    cell: ({ row }) => (
      <div className="min-w-48">
        <p className="font-medium">
          {AUDIT_ENTITY_LABELS[row.original.entity as AuditEntity] ?? row.original.entity}
        </p>
        <p className="truncate font-mono text-xs text-muted-foreground">
          {row.original.entityLabel ?? row.original.entityId}
        </p>
      </div>
    ),
  },
  {
    id: "detail",
    header: () => <span className="sr-only">Detalle</span>,
    enableSorting: false,
    cell: ({ row }) => <DetailButton log={row.original} />,
    meta: { className: "w-12 text-right" },
  },
];

interface AuditTableProps {
  data: Paginated<AuditRow>;
  sortState: SortState;
  users: UserOption[];
}

export function AuditTable({ data, sortState, users }: AuditTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      sortState={sortState}
      searchPlaceholder="Buscar por id, usuario o contenido"
      showStatusFilter={false}
      filters={<AuditFilters users={users} />}
      emptyTitle="Sin registros"
      emptyDescription="No hay entradas de auditoría que coincidan con los filtros."
    />
  );
}
