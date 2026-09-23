import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { PurchaseOrderForm } from "@/features/purchase-orders/components/purchase-order-form";
import { canPerform } from "@/features/purchase-orders/lib/status";
import { getPurchaseOrderForEdit } from "@/features/purchase-orders/queries";
import { getProductOptions } from "@/features/stock/queries";
import { getSupplierOptions } from "@/features/suppliers/queries";
import { getWarehouseOptions } from "@/features/warehouses/queries";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "Editar orden de compra",
};

export default async function EditPurchaseOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!hasPermission(session?.user.role, "purchase-orders:manage")) redirect("/forbidden");

  const { id } = await params;
  const [order, suppliers, warehouses, products] = await Promise.all([
    getPurchaseOrderForEdit(id),
    getSupplierOptions(),
    getWarehouseOptions(),
    getProductOptions(),
  ]);
  if (!order) notFound();
  if (!canPerform(order.status, "edit")) redirect(`/purchase-orders/${id}`);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Editar ${order.code}`}
        description="Solo los borradores pueden editarse."
      />
      <PurchaseOrderForm
        suppliers={suppliers}
        warehouses={warehouses}
        products={products}
        initialValues={order.values}
        order={{ id: order.id, code: order.code }}
      />
    </div>
  );
}
