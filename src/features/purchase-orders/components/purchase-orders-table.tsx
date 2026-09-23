"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

import { ColumnHeader } from "@/components/tables/column-header";
import { DataTable, type SortState } from "@/components/tables/data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PurchaseOrderStatusBadge } from "@/features/purchase-orders/components/po-status-badge";
import type { PurchaseOrderRow } from "@/features/purchase-orders/queries";
import type { SupplierOption } from "@/features/suppliers/queries";
import type { WarehouseOption } from "@/features/warehouses/queries";
import { useTableParams } from "@/hooks/use-table-params";
import { PURCHASE_ORDER_STATUS_LABELS, PURCHASE_ORDER_STATUSES } from "@/lib/domain";
import { formatCurrency, formatInteger, formatShortDate } from "@/lib/format";
import type { Paginated } from "@/lib/query-params";

const columns: ColumnDef<PurchaseOrderRow, unknown>[] = [
  {
    id: "code",
    accessorKey: "code",
    header: ({ column }) => <ColumnHeader column={column} title="Código" />,
    cell: ({ row }) => (
      <Link
        href={`/purchase-orders/${row.original.id}`}
        className="font-mono font-medium hover:underline"
      >
        {row.original.code}
      </Link>
    ),
    meta: { className: "whitespace-nowrap" },
  },
  {
    id: "status",
    accessorKey: "status",
    header: ({ column }) => <ColumnHeader column={column} title="Estado" />,
    cell: ({ row }) => <PurchaseOrderStatusBadge status={row.original.status} />,
  },
  {
    id: "supplier",
    header: "Proveedor",
    enableSorting: false,
    cell: ({ row }) => (
      <div className="min-w-44">
        <p className="line-clamp-1">{row.original.supplierName}</p>
        <p className="text-xs text-muted-foreground">
          <span className="font-mono">{row.original.warehouseCode}</span>{" "}
          {row.original.warehouseName}
        </p>
      </div>
    ),
  },
  {
    id: "progress",
    header: "Recepción",
    enableSorting: false,
    cell: ({ row }) => {
      const { quantityOrdered, quantityReceived, itemCount } = row.original;
      const percent =
        quantityOrdered === 0 ? 0 : Math.round((quantityReceived / quantityOrdered) * 100);
      return (
        <div className="min-w-32">
          <div className="flex justify-between text-xs">
            <span>
              {formatInteger(quantityReceived)} / {formatInteger(quantityOrdered)} uds.
            </span>
            <span className="text-muted-foreground">{itemCount} ítem(s)</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      );
    },
  },
  {
    id: "total",
    header: "Total",
    enableSorting: false,
    cell: ({ row }) => formatCurrency(row.original.total),
    meta: { className: "text-right tabular-nums" },
  },
  {
    id: "expectedDate",
    accessorKey: "expectedDate",
    header: ({ column }) => <ColumnHeader column={column} title="Entrega" />,
    cell: ({ row }) =>
      row.original.expectedDate ? formatShortDate(row.original.expectedDate) : "-",
    meta: { className: "whitespace-nowrap" },
  },
  {
    id: "createdAt",
    accessorKey: "createdAt",
    header: ({ column }) => <ColumnHeader column={column} title="Creada" />,
    cell: ({ row }) => (
      <div>
        <p>{formatShortDate(row.original.createdAt)}</p>
        <p className="text-xs text-muted-foreground">{row.original.createdByName}</p>
      </div>
    ),
    meta: { className: "whitespace-nowrap" },
  },
];

const ALL = "all";

function PurchaseOrderFilters({
  suppliers,
  warehouses,
}: {
  suppliers: SupplierOption[];
  warehouses: WarehouseOption[];
}) {
  const { params, setFilter } = useTableParams();
  return (
    <>
      <Select value={params.get("status") ?? ALL} onValueChange={(v) => setFilter("status", v)}>
        <SelectTrigger className="w-full sm:w-48" aria-label="Filtrar por estado">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todos los estados</SelectItem>
          {PURCHASE_ORDER_STATUSES.map((status) => (
            <SelectItem key={status} value={status}>
              {PURCHASE_ORDER_STATUS_LABELS[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={params.get("supplierId") ?? ALL}
        onValueChange={(v) => setFilter("supplierId", v)}
      >
        <SelectTrigger className="w-full sm:w-52" aria-label="Filtrar por proveedor">
          <SelectValue placeholder="Proveedor" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todos los proveedores</SelectItem>
          {suppliers.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={params.get("warehouseId") ?? ALL}
        onValueChange={(v) => setFilter("warehouseId", v)}
      >
        <SelectTrigger className="w-full sm:w-44" aria-label="Filtrar por almacén">
          <SelectValue placeholder="Almacén" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todos los almacenes</SelectItem>
          {warehouses.map((w) => (
            <SelectItem key={w.id} value={w.id}>
              {w.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}

interface PurchaseOrdersTableProps {
  data: Paginated<PurchaseOrderRow>;
  sortState: SortState;
  suppliers: SupplierOption[];
  warehouses: WarehouseOption[];
}

export function PurchaseOrdersTable({
  data,
  sortState,
  suppliers,
  warehouses,
}: PurchaseOrdersTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      sortState={sortState}
      searchPlaceholder="Buscar por código, proveedor o notas"
      showStatusFilter={false}
      filters={<PurchaseOrderFilters suppliers={suppliers} warehouses={warehouses} />}
      emptyTitle="Sin órdenes de compra"
      emptyDescription="Crea una orden para reponer existencias con tus proveedores."
    />
  );
}
