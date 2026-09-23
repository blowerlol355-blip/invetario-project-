import { BookOpenTextIcon } from "lucide-react";
import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { MovementTypeBadge } from "@/components/movement-type-badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExportButtons } from "@/features/reports/components/export-buttons";
import {
  DateRangeFilter,
  ProductFilter,
  WarehouseFilter,
} from "@/features/reports/components/report-filters";
import { getKardexReport } from "@/features/reports/queries";
import { kardexFiltersSchema, normalizeRange } from "@/features/reports/schemas";
import { getWarehouseOptions } from "@/features/warehouses/queries";
import { prisma } from "@/lib/db";
import { formatCurrency, formatDateTime, formatInteger } from "@/lib/format";
import type { SearchParams } from "@/lib/query-params";

export const metadata: Metadata = {
  title: "Kardex",
};

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export default async function KardexReportPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const raw = await searchParams;
  const filters = kardexFiltersSchema.parse({
    productId: first(raw.productId),
    warehouseId: first(raw.warehouseId),
    from: first(raw.from),
    to: first(raw.to),
  });
  const range = normalizeRange(filters.from, filters.to);

  const [report, products, warehouses] = await Promise.all([
    getKardexReport({ ...filters, ...range }),
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, sku: true, name: true },
    }),
    getWarehouseOptions(),
  ]);
  const code = (id: string | null) => (id ? (report?.warehouseCodes.get(id) ?? "") : "");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kardex por producto"
        description="Saldo inicial, movimientos con saldo corrido y saldo final en el período."
        actions={
          <ExportButtons report="kardex" params={{ ...filters, ...range }} disabled={!report} />
        }
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <ProductFilter products={products} />
        <WarehouseFilter warehouses={warehouses} />
        <DateRangeFilter from={range.from} to={range.to} />
      </div>

      {!report ? (
        <div className="rounded-xl border bg-card">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <BookOpenTextIcon />
              </EmptyMedia>
              <EmptyTitle>Elige un producto</EmptyTitle>
              <EmptyDescription>
                Selecciona un producto y, si quieres, un almacén y un rango de fechas.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Saldo inicial", value: formatInteger(report.kardex.openingBalance) },
              { label: "Entradas", value: `+${formatInteger(report.kardex.totalInbound)}` },
              { label: "Salidas", value: `-${formatInteger(report.kardex.totalOutbound)}` },
              { label: "Saldo final", value: formatInteger(report.kardex.closingBalance) },
            ].map((kpi, index) => (
              <Card
                key={kpi.label}
                className="animate-fade-up"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">{kpi.label}</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">
                    {kpi.value}{" "}
                    <span className="text-sm font-normal text-muted-foreground">
                      {report.product.unit}
                    </span>
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="animate-fade-up overflow-hidden rounded-xl border bg-card [animation-delay:240ms]">
            <div className="border-b px-4 py-3 text-sm">
              <span className="font-medium">{report.product.name}</span>{" "}
              <span className="font-mono text-xs text-muted-foreground">{report.product.sku}</span>
              <span className="text-muted-foreground">
                {" "}
                · {report.warehouse ? report.warehouse.name : "Todos los almacenes"} · costo
                promedio actual {formatCurrency(report.product.avgCost)}
              </span>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Almacén</TableHead>
                    <TableHead>Referencia / motivo</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead className="text-right">Costo unit.</TableHead>
                    <TableHead className="text-right">Entrada</TableHead>
                    <TableHead className="text-right">Salida</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableCell colSpan={8} className="font-medium">
                      Saldo inicial al {range.from.split("-").reverse().join("/")}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {formatInteger(report.kardex.openingBalance)}
                    </TableCell>
                  </TableRow>
                  {report.kardex.lines.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                        Sin movimientos en el período.
                      </TableCell>
                    </TableRow>
                  )}
                  {report.kardex.lines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell className="whitespace-nowrap">
                        {formatDateTime(line.createdAt)}
                      </TableCell>
                      <TableCell>
                        <MovementTypeBadge type={line.type} />
                      </TableCell>
                      <TableCell className="font-mono text-xs whitespace-nowrap">
                        {line.fromWarehouseId && line.toWarehouseId
                          ? `${code(line.fromWarehouseId)} → ${code(line.toWarehouseId)}`
                          : code(line.fromWarehouseId) || code(line.toWarehouseId)}
                      </TableCell>
                      <TableCell>
                        <p className="line-clamp-1">{line.reason ?? "-"}</p>
                        {line.reference && (
                          <p className="font-mono text-xs text-muted-foreground">
                            {line.reference}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{line.userName}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {line.unitCost === null ? "-" : formatCurrency(line.unitCost)}
                      </TableCell>
                      <TableCell className="text-right text-success tabular-nums">
                        {line.inbound ? `+${formatInteger(line.inbound)}` : ""}
                      </TableCell>
                      <TableCell className="text-right text-destructive tabular-nums">
                        {line.outbound ? `-${formatInteger(line.outbound)}` : ""}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatInteger(line.balance)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-medium hover:bg-muted/50">
                    <TableCell colSpan={6}>Totales del período</TableCell>
                    <TableCell className="text-right tabular-nums">
                      +{formatInteger(report.kardex.totalInbound)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      -{formatInteger(report.kardex.totalOutbound)}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {formatInteger(report.kardex.closingBalance)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
