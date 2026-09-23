import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { PurchaseOrderForm } from "@/features/purchase-orders/components/purchase-order-form";
import { purchaseOrderDefaults, type PurchaseOrderInput } from "@/features/purchase-orders/schemas";
import { getProductOptions } from "@/features/stock/queries";
import { getSupplierOptions } from "@/features/suppliers/queries";
import { getWarehouseOptions } from "@/features/warehouses/queries";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import type { SearchParams } from "@/lib/query-params";

export const metadata: Metadata = {
  title: "Nueva orden de compra",
};

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

/** Cantidad sugerida: reponer hasta el máximo, o hasta el doble del mínimo si no hay máximo. */
function suggestedQuantity(product: {
  minStock: number;
  maxStock: number | null;
  stocks: { quantity: number }[];
}) {
  const current = product.stocks.reduce((sum, s) => sum + s.quantity, 0);
  const target = product.maxStock ?? Math.max(product.minStock * 2, 1);
  return Math.max(1, target - current);
}

export default async function NewPurchaseOrderPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  if (!hasPermission(session?.user.role, "purchase-orders:manage")) redirect("/forbidden");

  const raw = await searchParams;
  const [suppliers, warehouses, products] = await Promise.all([
    getSupplierOptions(),
    getWarehouseOptions(),
    getProductOptions(),
  ]);

  // Prefill desde alertas (?productId=) o desde un proveedor (?supplierId=).
  const product = products.find((p) => p.id === first(raw.productId));
  const initialValues: PurchaseOrderInput = {
    ...purchaseOrderDefaults,
    supplierId: suppliers.some((s) => s.id === first(raw.supplierId))
      ? first(raw.supplierId)
      : (product?.supplierId ?? ""),
    warehouseId: warehouses[0]?.id ?? "",
    items: product
      ? [
          {
            productId: product.id,
            quantityOrdered: suggestedQuantity(product),
            unitCost: product.costPrice,
          },
        ]
      : purchaseOrderDefaults.items,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nueva orden de compra"
        description="Selecciona el proveedor, el almacén donde se recibirá y los productos a pedir."
      />
      <PurchaseOrderForm
        suppliers={suppliers}
        warehouses={warehouses}
        products={products}
        initialValues={initialValues}
      />
    </div>
  );
}
