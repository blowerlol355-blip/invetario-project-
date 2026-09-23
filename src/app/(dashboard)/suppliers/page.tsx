import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { CreateSupplierButton } from "@/features/suppliers/components/create-supplier-button";
import { SuppliersTable } from "@/features/suppliers/components/suppliers-table";
import { listSuppliers, SUPPLIER_SORTS } from "@/features/suppliers/queries";
import { parseListParams, resolveSort, type SearchParams } from "@/lib/query-params";

export const metadata: Metadata = {
  title: "Proveedores",
};

interface SuppliersPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function SuppliersPage({ searchParams }: SuppliersPageProps) {
  const params = parseListParams(await searchParams);
  const data = await listSuppliers(params);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Proveedores"
        description="Empresas que abastecen el inventario y reciben las órdenes de compra."
        actions={<CreateSupplierButton />}
      />
      <SuppliersTable
        data={data}
        sortState={{ sort: resolveSort(params.sort, SUPPLIER_SORTS, "name"), order: params.order }}
      />
    </div>
  );
}
