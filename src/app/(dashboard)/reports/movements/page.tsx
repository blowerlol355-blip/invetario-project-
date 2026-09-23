import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { ExportButtons } from "@/features/reports/components/export-buttons";
import { normalizeRange } from "@/features/reports/schemas";
import { MovementsTable } from "@/features/stock/components/movements-table";
import { getUserOptions, listMovements } from "@/features/stock/queries";
import { movementFiltersSchema } from "@/features/stock/schemas";
import { getWarehouseOptions } from "@/features/warehouses/queries";
import { parseListParams, type SearchParams } from "@/lib/query-params";

export const metadata: Metadata = {
  title: "Movimientos por fecha",
};

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export default async function MovementsReportPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const raw = await searchParams;
  const params = parseListParams(raw, { order: "desc" });
  const parsed = movementFiltersSchema.parse({
    type: first(raw.type),
    warehouseId: first(raw.warehouseId),
    productId: first(raw.productId),
    userId: first(raw.userId),
    from: first(raw.from),
    to: first(raw.to),
  });
  const filters = { ...parsed, ...normalizeRange(parsed.from, parsed.to) };

  const [data, warehouses, users] = await Promise.all([
    listMovements(params, filters),
    getWarehouseOptions(),
    getUserOptions(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Movimientos por fecha"
        description={`${data.total} movimientos en el período seleccionado (por defecto, los últimos 30 días).`}
        actions={
          <ExportButtons
            report="movements"
            params={{ ...filters, q: params.q }}
            disabled={data.total === 0}
          />
        }
      />
      <MovementsTable
        data={data}
        sortState={{ sort: "createdAt", order: params.order }}
        warehouses={warehouses}
        users={users}
        defaultRange={{ from: filters.from, to: filters.to }}
      />
    </div>
  );
}
