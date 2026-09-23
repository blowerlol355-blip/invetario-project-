import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { CreateWarehouseButton } from "@/features/warehouses/components/create-warehouse-button";
import { WarehousesTable } from "@/features/warehouses/components/warehouses-table";
import { listWarehouses, WAREHOUSE_SORTS } from "@/features/warehouses/queries";
import { parseListParams, resolveSort, type SearchParams } from "@/lib/query-params";

export const metadata: Metadata = {
  title: "Almacenes",
};

interface WarehousesPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function WarehousesPage({ searchParams }: WarehousesPageProps) {
  const params = parseListParams(await searchParams);
  const data = await listWarehouses(params);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Almacenes"
        description="Ubicaciones físicas del inventario. Las existencias se llevan por almacén."
        actions={<CreateWarehouseButton />}
      />
      <WarehousesTable
        data={data}
        sortState={{ sort: resolveSort(params.sort, WAREHOUSE_SORTS, "code"), order: params.order }}
      />
    </div>
  );
}
