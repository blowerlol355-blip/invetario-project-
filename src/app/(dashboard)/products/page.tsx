import { PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { getCategoryOptions } from "@/features/categories/queries";
import { ProductsTable } from "@/features/products/components/products-table";
import { listProducts, PRODUCT_SORTS } from "@/features/products/queries";
import { productFiltersSchema } from "@/features/products/schemas";
import { getSupplierOptions } from "@/features/suppliers/queries";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { parseListParams, resolveSort, type SearchParams } from "@/lib/query-params";

export const metadata: Metadata = {
  title: "Productos",
};

interface ProductsPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const raw = await searchParams;
  const params = parseListParams(raw, { status: "active" });
  const filters = productFiltersSchema.parse({
    categoryId: raw.categoryId ?? "",
    supplierId: raw.supplierId ?? "",
  });

  const [session, data, categories, suppliers] = await Promise.all([
    auth(),
    listProducts(params, filters),
    getCategoryOptions(),
    getSupplierOptions(),
  ]);
  const canManage = hasPermission(session?.user.role, "products:manage");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Productos"
        description="Catálogo de productos con su existencia total, costo promedio y precio de venta."
        actions={
          canManage ? (
            <Button asChild>
              <Link href="/products/new">
                <PlusIcon className="size-4" />
                Nuevo producto
              </Link>
            </Button>
          ) : undefined
        }
      />
      <ProductsTable
        data={data}
        sortState={{ sort: resolveSort(params.sort, PRODUCT_SORTS, "name"), order: params.order }}
        categories={categories}
        suppliers={suppliers}
        canManage={canManage}
      />
    </div>
  );
}
