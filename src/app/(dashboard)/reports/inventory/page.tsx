import type { Metadata } from "next";
import Link from "next/link";
import { Fragment } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCategoryOptions } from "@/features/categories/queries";
import { ExportButtons } from "@/features/reports/components/export-buttons";
import {
  CategoryFilter,
  SearchFilter,
  WarehouseFilter,
} from "@/features/reports/components/report-filters";
import { getInventoryValuation, type InventoryValuationRow } from "@/features/reports/queries";
import { inventoryReportFiltersSchema } from "@/features/reports/schemas";
import { getWarehouseOptions } from "@/features/warehouses/queries";
import { formatCurrency, formatInteger } from "@/lib/format";
import type { SearchParams } from "@/lib/query-params";

export const metadata: Metadata = {
  title: "Inventario valorizado",
};

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

function groupByCategory(rows: InventoryValuationRow[]) {
  const groups = new Map<string, InventoryValuationRow[]>();
  for (const row of rows) {
    const list = groups.get(row.categoryName) ?? [];
    list.push(row);
    groups.set(row.categoryName, list);
  }
  return [...groups.entries()].map(([category, items]) => ({
    category,
    items,
    quantity: items.reduce((sum, item) => sum + item.quantity, 0),
    value: items.reduce((sum, item) => sum + item.value, 0),
  }));
}

export default async function InventoryReportPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const raw = await searchParams;
  const filters = inventoryReportFiltersSchema.parse({
    categoryId: first(raw.categoryId),
    warehouseId: first(raw.warehouseId),
    q: first(raw.q),
  });
  const [data, categories, warehouses] = await Promise.all([
    getInventoryValuation(filters),
    getCategoryOptions(),
    getWarehouseOptions(),
  ]);
  const groups = groupByCategory(data.rows);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventario valorizado"
        description="Existencia por producto y su valor a costo promedio ponderado."
        actions={
          <ExportButtons report="inventory" params={filters} disabled={data.rows.length === 0} />
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Valor total", value: formatCurrency(data.totals.value) },
          { label: "Unidades", value: formatInteger(data.totals.quantity) },
          { label: "Productos", value: formatInteger(data.totals.products) },
        ].map((kpi, index) => (
          <Card
            key={kpi.label}
            className="animate-fade-up"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{kpi.label}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchFilter placeholder="Buscar por nombre o SKU" />
        <CategoryFilter categories={categories} />
        <WarehouseFilter warehouses={warehouses} />
      </div>

      <div className="animate-fade-up overflow-hidden rounded-xl border bg-card [animation-delay:200ms]">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Producto</TableHead>
                <TableHead className="text-right">Existencia</TableHead>
                <TableHead className="text-right">Stock mín.</TableHead>
                <TableHead className="text-right">Costo prom.</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">% del total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No hay productos que coincidan con los filtros.
                  </TableCell>
                </TableRow>
              )}
              {groups.map((group) => (
                <Fragment key={group.category}>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableCell className="font-semibold">{group.category}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatInteger(group.quantity)}
                    </TableCell>
                    <TableCell />
                    <TableCell />
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatCurrency(group.value)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {data.totals.value > 0
                        ? `${((group.value / data.totals.value) * 100).toFixed(1)}%`
                        : "-"}
                    </TableCell>
                  </TableRow>
                  {group.items.map((row) => (
                    <TableRow key={row.productId}>
                      <TableCell>
                        <Link
                          href={`/products/${row.productId}`}
                          className="font-medium hover:underline"
                        >
                          {row.name}
                        </Link>
                        <p className="font-mono text-xs text-muted-foreground">{row.sku}</p>
                      </TableCell>
                      <TableCell
                        className={`text-right tabular-nums ${row.quantity <= row.minStock ? "font-medium text-warning-foreground dark:text-warning" : ""}`}
                      >
                        {formatInteger(row.quantity)}{" "}
                        <span className="text-xs text-muted-foreground">{row.unit}</span>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground tabular-nums">
                        {formatInteger(row.minStock)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(row.avgCost)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(row.value)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground tabular-nums">
                        {data.totals.value > 0
                          ? `${((row.value / data.totals.value) * 100).toFixed(1)}%`
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
