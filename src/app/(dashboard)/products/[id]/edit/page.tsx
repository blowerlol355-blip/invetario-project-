import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { getCategoryOptions } from "@/features/categories/queries";
import { ProductForm } from "@/features/products/components/product-form";
import { getProductForEdit } from "@/features/products/queries";
import type { ProductInput } from "@/features/products/schemas";
import { getSupplierOptions } from "@/features/suppliers/queries";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "Editar producto",
};

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const session = await auth();
  if (!hasPermission(session?.user.role, "products:manage")) redirect("/forbidden");

  const { id } = await params;
  const [product, categories, suppliers] = await Promise.all([
    getProductForEdit(id),
    getCategoryOptions(),
    getSupplierOptions(),
  ]);
  if (!product) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Editar ${product.values.name}`}
        description="Los cambios quedan registrados en la bitácora de auditoría."
      />
      <ProductForm
        categories={categories}
        suppliers={suppliers}
        product={{ id: product.id, values: product.values as ProductInput }}
      />
    </div>
  );
}
