import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { getCategoryOptions } from "@/features/categories/queries";
import { ProductForm } from "@/features/products/components/product-form";
import { getSupplierOptions } from "@/features/suppliers/queries";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "Nuevo producto",
};

export default async function NewProductPage() {
  const session = await auth();
  if (!hasPermission(session?.user.role, "products:manage")) redirect("/forbidden");

  const [categories, suppliers] = await Promise.all([getCategoryOptions(), getSupplierOptions()]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nuevo producto"
        description="Completa la ficha del producto. El stock inicial se registra después como una entrada."
      />
      <ProductForm categories={categories} suppliers={suppliers} />
    </div>
  );
}
