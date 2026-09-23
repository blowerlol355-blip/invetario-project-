import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { CategoriesTable } from "@/features/categories/components/categories-table";
import { CreateCategoryButton } from "@/features/categories/components/create-category-button";
import { CATEGORY_SORTS, listCategories } from "@/features/categories/queries";
import { parseListParams, resolveSort, type SearchParams } from "@/lib/query-params";

export const metadata: Metadata = {
  title: "Categorías",
};

interface CategoriesPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function CategoriesPage({ searchParams }: CategoriesPageProps) {
  const params = parseListParams(await searchParams);
  const data = await listCategories(params);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categorías"
        description="Agrupa los productos del inventario para filtrarlos y analizarlos."
        actions={<CreateCategoryButton />}
      />
      <CategoriesTable
        data={data}
        sortState={{ sort: resolveSort(params.sort, CATEGORY_SORTS, "name"), order: params.order }}
      />
    </div>
  );
}
