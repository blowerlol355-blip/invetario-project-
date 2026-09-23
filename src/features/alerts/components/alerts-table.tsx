"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ShoppingCartIcon } from "lucide-react";
import Link from "next/link";

import { ColumnHeader } from "@/components/tables/column-header";
import { DataTable } from "@/components/tables/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AlertRow } from "@/features/alerts/queries";
import { StockStatusBadge } from "@/features/products/components/stock-status-badge";
import { formatInteger } from "@/lib/format";
import type { Paginated } from "@/lib/query-params";

function buildColumns(canOrder: boolean): ColumnDef<AlertRow, unknown>[] {
  return [
    {
      id: "name",
      header: ({ column }) => <ColumnHeader column={column} title="Producto" />,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="min-w-52">
          <Link href={`/products/${row.original.id}`} className="font-medium hover:underline">
            {row.original.name}
          </Link>
          <p className="text-xs text-muted-foreground">
            <span className="font-mono">{row.original.sku}</span> · {row.original.categoryName}
          </p>
        </div>
      ),
    },
    {
      id: "supplier",
      header: "Proveedor",
      enableSorting: false,
      cell: ({ row }) =>
        row.original.supplierName ?? <span className="text-muted-foreground">Sin proveedor</span>,
    },
    {
      id: "stock",
      header: "Existencia",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex flex-col items-end gap-1">
          <span className="tabular-nums">
            <span className="font-semibold">{formatInteger(row.original.totalStock)}</span>
            <span className="text-muted-foreground">
              {" "}
              / mín. {formatInteger(row.original.minStock)}
            </span>
          </span>
          <StockStatusBadge
            quantity={row.original.totalStock}
            minStock={row.original.minStock}
            maxStock={row.original.maxStock}
            className="text-[10px]"
          />
        </div>
      ),
      meta: { className: "text-right" },
    },
    {
      id: "suggested",
      header: "Sugerido pedir",
      enableSorting: false,
      cell: ({ row }) => (
        <span className="tabular-nums">
          {formatInteger(row.original.suggestedQuantity)}{" "}
          <span className="text-xs text-muted-foreground">{row.original.unit}</span>
        </span>
      ),
      meta: { className: "text-right" },
    },
    {
      id: "openOrders",
      header: "En pedido",
      enableSorting: false,
      cell: ({ row }) =>
        row.original.openOrders.length === 0 ? (
          <span className="text-xs text-muted-foreground">No</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {row.original.openOrders.map((order) => (
              <Link key={order.id} href={`/purchase-orders/${order.id}`}>
                <Badge variant="outline" className="font-mono text-[10px] hover:bg-accent">
                  {order.code} · {formatInteger(order.pending)}
                </Badge>
              </Link>
            ))}
          </div>
        ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Acciones</span>,
      enableSorting: false,
      cell: ({ row }) =>
        canOrder ? (
          <Button size="sm" variant="outline" asChild>
            <Link href={`/purchase-orders/new?productId=${row.original.id}`}>
              <ShoppingCartIcon className="size-4" />
              Crear orden
            </Link>
          </Button>
        ) : null,
      meta: { className: "text-right whitespace-nowrap" },
    },
  ];
}

interface AlertsTableProps {
  data: Paginated<AlertRow>;
  canOrder: boolean;
}

export function AlertsTable({ data, canOrder }: AlertsTableProps) {
  return (
    <DataTable
      columns={buildColumns(canOrder)}
      data={data}
      sortState={{ sort: "", order: "asc" }}
      searchPlaceholder="Buscar por nombre o SKU"
      showStatusFilter={false}
      emptyTitle="Sin alertas"
      emptyDescription="Todos los productos activos están por encima de su stock mínimo."
    />
  );
}
