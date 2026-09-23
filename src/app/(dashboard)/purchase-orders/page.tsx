import { PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { PurchaseOrdersTable } from "@/features/purchase-orders/components/purchase-orders-table";
import { listPurchaseOrders, PURCHASE_ORDER_SORTS } from "@/features/purchase-orders/queries";
import { purchaseOrderFiltersSchema } from "@/features/purchase-orders/schemas";
import { getSupplierOptions } from "@/features/suppliers/queries";
import { getWarehouseOptions } from "@/features/warehouses/queries";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { parseListParams, resolveSort, type SearchParams } from "@/lib/query-params";

export const metadata: Metadata = {
  title: "Órdenes de compra",
};

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export default async function PurchaseOrdersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const raw = await searchParams;
  const params = parseListParams(raw, { order: "desc" });
  const filters = purchaseOrderFiltersSchema.parse({
    status: first(raw.status),
    supplierId: first(raw.supplierId),
    warehouseId: first(raw.warehouseId),
  });

  const [session, data, suppliers, warehouses] = await Promise.all([
    auth(),
    listPurchaseOrders(params, filters),
    getSupplierOptions(),
    getWarehouseOptions(),
  ]);
  const canManage = hasPermission(session?.user.role, "purchase-orders:manage");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Órdenes de compra"
        description="Pedidos a proveedores: borrador, envío, recepción parcial o total y cancelación."
        actions={
          canManage ? (
            <Button asChild>
              <Link href="/purchase-orders/new">
                <PlusIcon className="size-4" />
                Nueva orden
              </Link>
            </Button>
          ) : undefined
        }
      />
      <PurchaseOrdersTable
        data={data}
        sortState={{
          sort: resolveSort(params.sort, PURCHASE_ORDER_SORTS, "createdAt"),
          order: params.order,
        }}
        suppliers={suppliers}
        warehouses={warehouses}
      />
    </div>
  );
}
