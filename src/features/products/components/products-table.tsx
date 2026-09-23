"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

import { StatusBadge } from "@/components/status-badge";
import { ColumnHeader } from "@/components/tables/column-header";
import { DataTable, type SortState } from "@/components/tables/data-table";
import type { CategoryOption } from "@/features/categories/queries";
import { ProductFilters } from "@/features/products/components/product-filters";
import { ProductRowActions } from "@/features/products/components/product-row-actions";
import { StockStatusBadge } from "@/features/products/components/stock-status-badge";
import type { ProductRow } from "@/features/products/queries";
import type { SupplierOption } from "@/features/suppliers/queries";
import { formatCurrency, formatInteger } from "@/lib/format";
import type { Paginated } from "@/lib/query-params";

function buildColumns(canManage: boolean): ColumnDef<ProductRow, unknown>[] {
  return [
    {
      id: "name",
      accessorKey: "name",
      header: ({ column }) => <ColumnHeader column={column} title="Producto" />,
      cell: ({ row }) => (
        <div className="min-w-56">
          <Link href={`/products/${row.original.id}`} className="font-medium hover:underline">
            {row.original.name}
          </Link>
          <p className="font-mono text-xs text-muted-foreground">
            {row.original.sku}
            {row.original.barcode ? ` · ${row.original.barcode}` : ""}
          </p>
        </div>
      ),
    },
    {
      id: "category",
      accessorKey: "categoryName",
      header: ({ column }) => <ColumnHeader column={column} title="Categoría" />,
      cell: ({ row }) => (
        <div className="min-w-32">
          <p>{row.original.categoryName}</p>
          {row.original.supplierName && (
            <p className="line-clamp-1 text-xs text-muted-foreground">
              {row.original.supplierName}
            </p>
          )}
        </div>
      ),
    },
    {
      id: "totalStock",
      header: "Stock",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex flex-col items-end gap-1">
          <span className="tabular-nums">
            {formatInteger(row.original.totalStock)}{" "}
            <span className="text-xs text-muted-foreground">{row.original.unit}</span>
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
      id: "costPrice",
      accessorKey: "avgCost",
      header: ({ column }) => (
        <ColumnHeader column={column} title="Costo prom." className="justify-end" />
      ),
      cell: ({ row }) => formatCurrency(row.original.avgCost),
      meta: { className: "text-right tabular-nums" },
    },
    {
      id: "salePrice",
      accessorKey: "salePrice",
      header: ({ column }) => (
        <ColumnHeader column={column} title="Precio" className="justify-end" />
      ),
      cell: ({ row }) => formatCurrency(row.original.salePrice),
      meta: { className: "text-right tabular-nums" },
    },
    {
      id: "isActive",
      header: "Estado",
      enableSorting: false,
      cell: ({ row }) => <StatusBadge active={row.original.isActive} />,
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Acciones</span>,
      enableSorting: false,
      cell: ({ row }) => <ProductRowActions product={row.original} canManage={canManage} />,
      meta: { className: "w-12 text-right" },
    },
  ];
}

interface ProductsTableProps {
  data: Paginated<ProductRow>;
  sortState: SortState;
  categories: CategoryOption[];
  suppliers: SupplierOption[];
  canManage: boolean;
}

export function ProductsTable({
  data,
  sortState,
  categories,
  suppliers,
  canManage,
}: ProductsTableProps) {
  return (
    <DataTable
      columns={buildColumns(canManage)}
      data={data}
      sortState={sortState}
      searchPlaceholder="Buscar por nombre, SKU o código de barras"
      filters={<ProductFilters categories={categories} suppliers={suppliers} />}
      emptyTitle="Sin productos"
      emptyDescription="No hay productos que coincidan con la búsqueda o los filtros."
    />
  );
}
